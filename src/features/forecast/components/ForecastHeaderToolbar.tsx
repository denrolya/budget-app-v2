import { Download, Upload } from 'lucide-react';
import React, { useCallback, useRef } from 'react';

import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { cn } from '@/lib/utils';

import { TIME_HORIZON_LABELS, TIME_HORIZONS } from '../constants';
import type { SavedScenario, TimeHorizon } from '../models/types';

import ForecastGuideDialog from './ForecastGuideDialog';
import ForecastInfoDialog from './ForecastInfoDialog';

interface Props {
  horizon: TimeHorizon;
  showFi: boolean;
  fiProgress: number;
  fiTarget: number;
  breakEvenYears: number | null | undefined;
  predictionMode: 'smart' | 'simple';
  incomeTrend: number;
  expenseTrend: number;
  totalOutliers: number;
  compareScenario: SavedScenario | undefined;
  onExport: () => void;
  onHorizonChange: (h: TimeHorizon) => void;
  onImportFile: (file: File) => void;
  onToggleFi: () => void;
}

const ForecastHeaderToolbar: React.FC<Props> = ({
  horizon,
  showFi,
  fiProgress,
  fiTarget,
  breakEvenYears,
  predictionMode,
  incomeTrend,
  expenseTrend,
  totalOutliers,
  compareScenario,
  onExport,
  onHorizonChange,
  onImportFile,
  onToggleFi,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImportFile(file);
        e.target.value = '';
      }
    },
    [onImportFile],
  );

  return (
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
            onClick={() => onHorizonChange(h)}
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
            {breakEvenYears != null
              ? ` Reached in ~${breakEvenYears} years.`
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
          onClick={onToggleFi}
        >
          FI {fiProgress}%
        </button>
      </ResponsiveTooltip>

      <div className="h-4 w-px bg-border" />

      {/* Prediction mode badge */}
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
          onClick={onExport}
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
};

export default ForecastHeaderToolbar;
