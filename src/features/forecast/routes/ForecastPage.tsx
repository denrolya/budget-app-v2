import React, { useCallback, useMemo, useState } from 'react';

import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useMonthlyStats } from '@/hooks/statistics/useMonthlyStats';
import { cn } from '@/lib/utils';

import DiagnosticsPanel from '../components/DiagnosticsPanel';
import EventsPanel from '../components/EventsPanel';
import ForecastHeaderToolbar from '../components/ForecastHeaderToolbar';
import ReferenceLinesPanel from '../components/ReferenceLinesPanel';
import RunwayChart from '../components/RunwayChart';
import ScenarioControls from '../components/ScenarioControls';
import ScenariosPanel from '../components/ScenariosPanel';
import StrategyPanel from '../components/StrategyPanel';
import { ANALYSIS_WINDOWS, computeFiTarget } from '../constants';
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
  const handleImportFile = useCallback(
    (file: File) => importConfig(file, replaceEvents),
    [importConfig, replaceEvents],
  );

  const chartContent = isLoading ? (
    <div className="flex-1 flex items-center justify-center">
      <span className="text-xs font-mono text-muted-foreground/50 animate-pulse">Loading forecast data...</span>
    </div>
  ) : (
    <RunwayChart
      compareData={compareChartData}
      compareName={compareScenario?.name}
      data={chartData}
      events={events}
      fiTarget={showFi ? fiTarget : undefined}
      minCashReserve={config.minCashReserveMonths > 0 ? config.minCashReserveMonths * config.monthlyExpense : undefined}
      referenceLines={referenceLines}
    />
  );

  return (
    <PageWithSidebar collapsible resizable contentScrollable={false} sidebarWidth="w-72">
      <PageWithSidebar.Header title="Forecast">
        <ForecastHeaderToolbar
          breakEvenYears={result.breakEvenYears}
          compareScenario={compareScenario}
          expenseTrend={expenseTrend}
          fiProgress={fiProgress}
          fiTarget={fiTarget}
          horizon={horizon}
          incomeTrend={incomeTrend}
          predictionMode={predictionMode}
          showFi={showFi}
          totalOutliers={totalOutliers}
          onExport={handleExport}
          onHorizonChange={setHorizon}
          onImportFile={handleImportFile}
          onToggleFi={() => setShowFi(!showFi)}
        />
      </PageWithSidebar.Header>

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

        <div className="flex-1 min-h-0 p-4">{chartContent}</div>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

export default ForecastPage;
