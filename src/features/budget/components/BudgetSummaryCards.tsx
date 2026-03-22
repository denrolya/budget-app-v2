import { Info } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import type { ConvertedValues } from '@/features/transactions';

import type { BudgetDTO, BudgetAnalyticsItem } from '../api/types';
import useBudgetTotals from '../hooks/useBudgetTotals';
import { computeHealthScore, formatBudgetAmount } from '../utils';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const MiniBar: React.FC<{ value: number; max?: number; colorClass: string }> = ({ value, max = 100, colorClass }) => (
  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden min-w-0">
    <div
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      className={cn('h-full rounded-full transition-all', colorClass)}
    />
  </div>
);

const BudgetSummaryCards: React.FC<Props> = ({ budget, analytics, displayCurrency, rates }) => {
  const stats = useBudgetTotals(budget, analytics, displayCurrency, rates);

  const pctColor = stats.percentUsed > 100 ? 'text-destructive' : stats.percentUsed > 80 ? 'text-warning' : undefined;
  const pctBarColor = stats.percentUsed > 100 ? 'bg-destructive' : stats.percentUsed > 80 ? 'bg-warning' : 'bg-primary';
  const remainingColor = stats.remaining < 0 ? 'text-destructive' : 'text-success';
  const savingsColor = stats.netSavings >= 0 ? 'text-success' : 'text-destructive';

  const healthResult = computeHealthScore(
    stats.percentUsed,
    stats.daysElapsed,
    stats.daysTotal,
    stats.totalPlannedIncome,
    stats.totalActualIncome,
  );
  const { score, grade, gradeColor, factors } = healthResult;

  let gradeBarColor: string;
  if (gradeColor === 'text-destructive') {
    gradeBarColor = 'bg-destructive';
  } else if (gradeColor.includes('warning')) {
    gradeBarColor = 'bg-warning';
  } else {
    gradeBarColor = 'bg-success';
  }

  const daysPct = stats.daysTotal > 0 ? (stats.daysElapsed / stats.daysTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border -mx-4 border-t text-sm">
      {/* Expenses */}
      <div className="px-4 py-2.5 space-y-1.5">
        <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Expenses</div>
        <div className="flex items-baseline gap-1 min-w-0">
          <span className={cn('font-semibold tabular-nums truncate', pctColor)}>
            {formatBudgetAmount(stats.totalActualExpense, displayCurrency)}
          </span>
          <span className="text-2xs text-muted-foreground shrink-0">
            / {formatBudgetAmount(stats.totalPlannedExpense, displayCurrency)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MiniBar colorClass={pctBarColor} value={stats.percentUsed} />
          <span className={cn('text-2xs tabular-nums font-medium shrink-0', pctColor)}>
            {stats.percentUsed.toFixed(0)}%
          </span>
        </div>
        <div className={cn('text-2xs font-medium tabular-nums truncate', remainingColor)}>
          {stats.remaining < 0
            ? `${formatBudgetAmount(Math.abs(stats.remaining), displayCurrency)} over`
            : `${formatBudgetAmount(stats.remaining, displayCurrency)} left`}
        </div>
      </div>

      {/* Income */}
      <div className="px-4 py-2.5 space-y-1.5">
        <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Income</div>
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="font-semibold tabular-nums text-success truncate">
            {formatBudgetAmount(stats.totalActualIncome, displayCurrency)}
          </span>
          {stats.totalPlannedIncome > 0 && (
            <span className="text-2xs text-muted-foreground shrink-0">
              / {formatBudgetAmount(stats.totalPlannedIncome, displayCurrency)}
            </span>
          )}
        </div>
        {stats.totalPlannedIncome > 0 && (
          <MiniBar colorClass="bg-success" max={stats.totalPlannedIncome} value={stats.totalActualIncome} />
        )}
        <div className={cn('text-2xs font-medium tabular-nums truncate', savingsColor)}>
          {stats.netSavings >= 0 ? '+' : '-'}
          {formatBudgetAmount(Math.abs(stats.netSavings), displayCurrency)} net
        </div>
      </div>

      {/* Health */}
      <div className="px-4 py-2.5 flex items-center gap-3">
        <span className={cn('font-bold text-2xl tabular-nums leading-none shrink-0', gradeColor)}>{grade}</span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1">
            <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Health</div>
            <ResponsiveTooltip
              desktopComponent="hovercard"
              content={
                <div className="text-xs space-y-1.5">
                  <p className="font-semibold text-sm">Budget Health Score</p>
                  <p>Starts at 100 and deducts points for:</p>
                  <ul className="space-y-0.5 pl-1">
                    <li>Overspend: −2 per % over budget (up to −50)</li>
                    <li>Approaching limit (&gt;85%): mild penalty</li>
                    <li>Pace ahead of schedule: up to −20</li>
                    <li>Income below 90% of planned: up to −15</li>
                  </ul>
                  {(factors.overspendPenalty > 0 || factors.pacePenalty > 0 || factors.incomePenalty > 0) && (
                    <div className="border-t pt-1.5 space-y-0.5">
                      <p className="font-medium">Active penalties:</p>
                      {factors.overspendPenalty > 0 && (
                        <p className={cn(gradeColor)}>Overspend: −{factors.overspendPenalty} pts</p>
                      )}
                      {factors.pacePenalty > 0 && (
                        <p className={cn(gradeColor)}>
                          Pace {factors.paceAhead}% ahead: −{factors.pacePenalty} pts
                        </p>
                      )}
                      {factors.incomePenalty > 0 && (
                        <p className={cn(gradeColor)}>
                          Income at {factors.incomePct}%: −{factors.incomePenalty} pts
                        </p>
                      )}
                    </div>
                  )}
                  <p className="font-medium mt-1">Grade thresholds:</p>
                  <ul className="space-y-0.5 pl-1">
                    <li>
                      <span className="text-success font-bold">A</span> ≥ 90 — excellent
                    </li>
                    <li>
                      <span className="text-success/75 font-bold">B</span> ≥ 75 — good
                    </li>
                    <li>
                      <span className="text-warning font-bold">C</span> ≥ 60 — fair
                    </li>
                    <li>
                      <span className="text-warning/75 font-bold">D</span> ≥ 45 — needs work
                    </li>
                    <li>
                      <span className="text-destructive font-bold">F</span> &lt; 45 — critical
                    </li>
                  </ul>
                </div>
              }
              contentClassName="p-3 w-auto max-w-xs"
            >
              <button
                aria-label="Budget health score explanation"
                type="button"
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Info className="h-3 w-3" />
              </button>
            </ResponsiveTooltip>
          </div>
          <div className="flex items-center gap-2">
            <MiniBar colorClass={gradeBarColor} value={score} />
            <span className="text-2xs tabular-nums text-muted-foreground shrink-0">{score}</span>
          </div>
        </div>
      </div>

      {/* Period */}
      <div className="px-4 py-2.5 space-y-1.5">
        <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Period</div>
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="font-semibold tabular-nums">{stats.daysElapsed}</span>
          <span className="text-2xs text-muted-foreground">/ {stats.daysTotal} days</span>
        </div>
        <div className="flex items-center gap-2">
          <MiniBar colorClass="bg-primary" value={daysPct} />
          {stats.daysLeft > 0 && (
            <span className="text-2xs tabular-nums text-muted-foreground shrink-0">{stats.daysLeft} left</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetSummaryCards;
