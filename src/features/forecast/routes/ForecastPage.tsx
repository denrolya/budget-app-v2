import { Download, Upload } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useMonthlyStats } from '@/hooks/statistics/useMonthlyStats';
import { cn } from '@/lib/utils';

import DiagnosticsPanel from '../components/DiagnosticsPanel';
import EventsPanel from '../components/EventsPanel';
import ForecastGuideDialog from '../components/ForecastGuideDialog';
import ForecastInfoDialog from '../components/ForecastInfoDialog';
import ReferenceLinesPanel from '../components/ReferenceLinesPanel';
import RunwayChart from '../components/RunwayChart';
import ScenarioControls from '../components/ScenarioControls';
import ScenariosPanel from '../components/ScenariosPanel';
import StrategyPanel from '../components/StrategyPanel';
import { ANALYSIS_WINDOWS, TIME_HORIZON_LABELS, TIME_HORIZONS, computeFiTarget } from '../constants';
import type { AnalysisWindow } from '../constants';
import { useEvents } from '../hooks/useEvents';
import { useFinancialSnapshot } from '../hooks/useFinancialSnapshot';
import { useForecastConfig } from '../hooks/useForecastConfig';
import { useScenarios } from '../hooks/useScenarios';
import { useStrategyDiagnostics } from '../hooks/useStrategyDiagnostics';
import { projectCashFlow, reconstructHistoricalBalance } from '../lib/scenarioEngine';
import { computeStrategyMetrics } from '../lib/strategyMetrics';
import type {
  ProjectionPoint,
  ReferenceLine,
  SavedScenario,
  ScenarioConfig,
  SimulationResult,
  TimeHorizon,
} from '../models/types';

const ForecastPage: React.FC = () => {
  const { events, addEvent, removeEvent, toggleEvent, replaceAll: replaceEvents } = useEvents();
  const {
    horizon,
    setHorizon: setHorizonRaw,
    showFi,
    setShowFi: setShowFiRaw,
    analysisMonths,
    setAnalysisMonths: setAnalysisMonthsRaw,
    overrides,
    setOverrides: setOverridesRaw,
    resetOverrides: resetOverridesRaw,
    referenceLines,
    addReferenceLine: addRefLineRaw,
    removeReferenceLine: removeRefLineRaw,
    exportConfig,
    importConfig,
  } = useForecastConfig();
  const { defaults, monthlyFlows, isLoading, predictionMode, incomeTrend, expenseTrend } =
    useFinancialSnapshot(analysisMonths);
  const { incomeOutliers, expenseOutliers } = useMonthlyStats();
  const totalOutliers = incomeOutliers + expenseOutliers;
  const { scenarios, saveScenario, deleteScenario } = useScenarios();
  const [compareId, setCompareId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wrap state setters to include events for persistence
  const setHorizon = useCallback((h: TimeHorizon) => setHorizonRaw(h, events), [setHorizonRaw, events]);
  const setShowFi = useCallback((fi: boolean) => setShowFiRaw(fi, events), [setShowFiRaw, events]);
  const setAnalysisMonths = useCallback(
    (am: AnalysisWindow) => setAnalysisMonthsRaw(am, events),
    [setAnalysisMonthsRaw, events],
  );
  const handleOverrides = useCallback(
    (patch: Partial<ScenarioConfig>) => setOverridesRaw((prev) => ({ ...prev, ...patch }), events),
    [setOverridesRaw, events],
  );
  const handleReset = useCallback(() => resetOverridesRaw(events), [resetOverridesRaw, events]);
  const addReferenceLine = useCallback(
    (line: Omit<ReferenceLine, 'id'>) => addRefLineRaw(line, events),
    [addRefLineRaw, events],
  );
  const removeReferenceLine = useCallback((id: string) => removeRefLineRaw(id, events), [removeRefLineRaw, events]);

  // Current scenario
  const config = useMemo<ScenarioConfig>(
    () => ({ ...defaults, horizonMonths: horizon, ...overrides, events }),
    [defaults, horizon, overrides, events],
  );
  const result = useMemo(() => projectCashFlow(config), [config]);

  // Comparison scenario
  const compareScenario = useMemo(() => scenarios.find((s) => s.id === compareId), [scenarios, compareId]);
  // Compare scenario always uses the CURRENT horizon — both scenarios
  // must project over the same timeframe for a meaningful comparison.
  const compareConfig = useMemo<ScenarioConfig | null>(() => {
    if (!compareScenario) return null;
    return { ...defaults, horizonMonths: horizon, ...compareScenario.overrides, events: compareScenario.events };
  }, [defaults, compareScenario, horizon]);
  const compareResult = useMemo<SimulationResult | null>(
    () => (compareConfig ? projectCashFlow(compareConfig) : null),
    [compareConfig],
  );
  const compareMetrics = useMemo(
    () => (compareConfig && compareResult ? computeStrategyMetrics(compareConfig, compareResult) : null),
    [compareConfig, compareResult],
  );

  // Historical balance reconstruction
  const pastFlows = useMemo(() => {
    if (monthlyFlows.length === 0) return [];
    const firstForecastDate = result.points[0]?.date;
    if (!firstForecastDate) return monthlyFlows;
    return monthlyFlows.filter((f) => f.date < firstForecastDate);
  }, [monthlyFlows, result.points]);

  const historicalPoints = useMemo<ProjectionPoint[]>(
    () => reconstructHistoricalBalance(defaults.currentBalance, pastFlows),
    [defaults.currentBalance, pastFlows],
  );

  const chartData = useMemo<ProjectionPoint[]>(
    () => [...historicalPoints, ...result.points],
    [historicalPoints, result.points],
  );

  // Comparison chart data (projected only, no historical reconstruction — both start from same balance)
  const compareChartData = useMemo<ProjectionPoint[] | null>(
    () => (compareResult ? [...historicalPoints, ...compareResult.points] : null),
    [historicalPoints, compareResult],
  );

  // Strategy metrics
  const metrics = useMemo(() => computeStrategyMetrics(config, result), [config, result]);
  const { results: diagnosticResults, score: diagScore, grade: diagGrade } = useStrategyDiagnostics(metrics, config);

  const fiTarget = computeFiTarget(config.monthlyExpense);
  const fiProgress = fiTarget > 0 ? Math.min(100, Math.round((result.finalInvestmentValue / fiTarget) * 100)) : 0;

  // Scenario actions
  const handleLoadScenario = useCallback(
    (s: SavedScenario) => {
      setHorizonRaw(s.horizon, s.events);
      setOverridesRaw(() => s.overrides, s.events);
      replaceEvents(s.events);
    },
    [setHorizonRaw, setOverridesRaw, replaceEvents],
  );

  const handleExport = useCallback(() => exportConfig(events), [exportConfig, events]);
  const handleImport = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        importConfig(file, replaceEvents);
        e.target.value = '';
      }
    },
    [importConfig, replaceEvents],
  );

  const headerToolbar = (
    <div className="flex items-center gap-2">
      {/* Horizon segmented control */}
      <div className="flex items-center gap-0.5 bg-muted rounded p-0.5">
        {TIME_HORIZONS.map((h) => (
          <button
            aria-label={`${TIME_HORIZON_LABELS[h]} horizon`}
            aria-pressed={horizon === h}
            type="button"
            className={cn(
              'h-5 px-1.5 text-2xs font-medium rounded-sm transition-colors',
              horizon === h ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            key={h}
            onClick={() => setHorizon(h)}
          >
            {TIME_HORIZON_LABELS[h]}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* FI toggle + progress */}
      <ResponsiveTooltip
        content={
          <span className="text-xs text-primary-foreground">
            Financial Independence target: {fiTarget.toLocaleString()} (25× annual expenses at 4% withdrawal rate).
            {result.breakEvenYears != null
              ? ` Reached in ~${result.breakEvenYears} years.`
              : ' Not reached within current horizon — try a longer one.'}
          </span>
        }
        contentClassName="p-2 max-w-[280px]"
      >
        <button
          aria-label="Toggle FI target line"
          aria-pressed={showFi}
          type="button"
          className={cn(
            'h-5 px-1.5 text-2xs font-mono font-medium rounded-sm border transition-colors inline-flex items-center gap-1',
            showFi
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setShowFi(!showFi)}
        >
          FI {fiProgress}%
        </button>
      </ResponsiveTooltip>

      <div className="h-4 w-px bg-border" />

      {/* Prediction mode */}
      <ResponsiveTooltip
        content={
          <div className="text-xs space-y-1.5 text-primary-foreground">
            <p className="font-medium">{predictionMode === 'smart' ? 'Smart Prediction' : 'Simple Prediction'}</p>
            <p className="text-primary-foreground/70">
              {predictionMode === 'smart'
                ? 'Analyzes your last 24 months of data. Recent months weigh more heavily. Outliers (unusual spikes) are auto-excluded. Two full seasonal cycles for better accuracy.'
                : 'Flat average of all available months — no weighting or trend detection.'}
            </p>
            {predictionMode === 'smart' && (
              <>
                <div className="flex gap-3 text-primary-foreground/70">
                  <span>
                    Income trend:{' '}
                    <span className={incomeTrend >= 1 ? 'text-success' : 'text-destructive'}>
                      {incomeTrend > 1 ? '+' : ''}
                      {Math.round((incomeTrend - 1) * 100)}%
                    </span>
                  </span>
                  <span>
                    Expense trend:{' '}
                    <span className={expenseTrend <= 1 ? 'text-success' : 'text-destructive'}>
                      {expenseTrend > 1 ? '+' : ''}
                      {Math.round((expenseTrend - 1) * 100)}%
                    </span>
                  </span>
                </div>
              </>
            )}
            {totalOutliers > 0 && (
              <p className="text-warning">
                {totalOutliers} outlier month{totalOutliers > 1 ? 's' : ''} excluded (IQR method)
              </p>
            )}
          </div>
        }
        contentClassName="p-2 max-w-[300px]"
      >
        <span
          className={cn('h-5 px-1.5 text-3xs font-mono rounded-sm border inline-flex items-center gap-1', {
            'border-primary/30 bg-primary/5 text-primary': predictionMode === 'smart',
            'border-border/40 text-muted-foreground': predictionMode === 'simple',
          })}
        >
          {predictionMode.toUpperCase()}
          {totalOutliers > 0 && <span className="text-warning">·{totalOutliers}</span>}
        </span>
      </ResponsiveTooltip>

      {/* Compare indicator */}
      {compareScenario && (
        <>
          <div className="h-4 w-px bg-border" />
          <span className="text-3xs font-mono text-muted-foreground">
            vs <span className="text-foreground">{compareScenario.name}</span>
          </span>
        </>
      )}

      <div className="h-4 w-px bg-border" />

      {/* Import / Export */}
      <ResponsiveTooltip content={<span className="text-xs text-primary-foreground">Export scenario to JSON</span>}>
        <button
          aria-label="Export config"
          type="button"
          className="h-5 w-5 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleExport}
        >
          <Download className="h-3 w-3" />
        </button>
      </ResponsiveTooltip>
      <ResponsiveTooltip content={<span className="text-xs text-primary-foreground">Import scenario from JSON</span>}>
        <button
          aria-label="Import config"
          type="button"
          className="h-5 w-5 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleImport}
        >
          <Upload className="h-3 w-3" />
        </button>
      </ResponsiveTooltip>
      <input hidden accept=".json" type="file" onChange={handleFileChange} ref={fileInputRef} />

      <div className="h-4 w-px bg-border" />
      <ForecastGuideDialog />
      <ForecastInfoDialog />
    </div>
  );

  const loadingContent = (
    <div className="flex-1 flex items-center justify-center">
      <span className="text-xs font-mono text-muted-foreground/50 animate-pulse">Loading forecast data...</span>
    </div>
  );

  return (
    <PageWithSidebar collapsible resizable contentScrollable={false} sidebarWidth="w-72">
      <PageWithSidebar.Header title="Forecast">{headerToolbar}</PageWithSidebar.Header>

      <PageWithSidebar.Sidebar ariaLabel="Scenario controls">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-4">
            {/* Analysis window — how many months of history SMART uses */}
            <div className="space-y-1">
              <span className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">
                Analysis Window
              </span>
              <div className="flex items-center gap-0.5 bg-muted rounded p-0.5">
                {ANALYSIS_WINDOWS.map((m) => (
                  <button
                    aria-label={`${m} months analysis`}
                    aria-pressed={analysisMonths === m}
                    type="button"
                    className={cn(
                      'flex-1 h-5 text-2xs font-mono font-medium rounded-sm transition-colors',
                      analysisMonths === m
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    key={m}
                    onClick={() => setAnalysisMonths(m)}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <ScenarioControls config={config} defaults={defaults} onChange={handleOverrides} onReset={handleReset} />
            <Separator />
            <EventsPanel events={events} onAdd={addEvent} onRemove={removeEvent} onToggle={toggleEvent} />
            <Separator />
            <ReferenceLinesPanel lines={referenceLines} onAdd={addReferenceLine} onRemove={removeReferenceLine} />
            <Separator />
            <ScenariosPanel
              compareId={compareId}
              currentEvents={events}
              currentHorizon={horizon}
              currentOverrides={overrides}
              scenarios={scenarios}
              onCompare={setCompareId}
              onDelete={deleteScenario}
              onLoad={handleLoadScenario}
              onSave={saveScenario}
            />
          </div>
        </ScrollArea>
      </PageWithSidebar.Sidebar>

      <PageWithSidebar.Content className="min-h-0 h-full flex flex-col">
        {!isLoading && (
          <StrategyPanel
            compareMetrics={compareMetrics}
            compareName={compareScenario?.name}
            fiTarget={fiTarget}
            horizonMonths={config.horizonMonths}
            metrics={metrics}
          />
        )}
        {!isLoading && (
          <DiagnosticsPanel defaultExpanded grade={diagGrade} results={diagnosticResults} score={diagScore} />
        )}

        <div className="flex-1 min-h-0 p-4">
          {isLoading ? (
            loadingContent
          ) : (
            <RunwayChart
              compareData={compareChartData}
              compareName={compareScenario?.name}
              data={chartData}
              events={events}
              fiTarget={showFi ? fiTarget : undefined}
              referenceLines={referenceLines}
              minCashReserve={
                config.minCashReserveMonths > 0 ? config.minCashReserveMonths * config.monthlyExpense : undefined
              }
            />
          )}
        </div>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default ForecastPage;
