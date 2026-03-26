import React from 'react';

import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import type { ConvertedValues } from '@/features/transactions';
import { cn } from '@/lib/utils';

import type { BudgetAnalyticsItem, BudgetDTO } from '../api/types';
import useBudgetTotals from '../hooks/useBudgetTotals';
import { computeHealthScore, formatBudgetAmount } from '../utils';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  analytics: BudgetAnalyticsItem[];
  budget: BudgetDTO;
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const Dot: React.FC = () => <span className="text-muted-foreground/30 select-none px-1">·</span>;

const BudgetHeaderStats: React.FC<Props> = ({ analytics, budget, displayCurrency, rates }) => {
  const stats = useBudgetTotals(budget, analytics, displayCurrency, rates);

  const pctColor = stats.percentUsed > 100 ? 'text-destructive' : stats.percentUsed > 80 ? 'text-warning' : undefined;
  const savingsColor = stats.netSavings >= 0 ? 'text-success' : 'text-destructive';

  const { score, grade, gradeColor, factors } = computeHealthScore(
    stats.percentUsed,
    stats.daysElapsed,
    stats.daysTotal,
    stats.totalPlannedIncome,
    stats.totalActualIncome,
  );

  const tooltipContent = (
    <div className="text-xs space-y-1.5">
      <p className="font-semibold text-sm">Budget Health</p>
      <p>Starts at 100, deducts points for:</p>
      <ul className="space-y-0.5 pl-1">
        <li>Overspend: −2 per % over (up to −50)</li>
        <li>Approaching limit (&gt;85%): mild penalty</li>
        <li>Pace ahead of schedule: up to −20</li>
        <li>Income below 90% of planned: up to −15</li>
      </ul>
      {(factors.overspendPenalty > 0 || factors.pacePenalty > 0 || factors.incomePenalty > 0) && (
        <div className="border-t pt-1.5 space-y-0.5">
          <p className="font-medium">Active penalties:</p>
          {factors.overspendPenalty > 0 && (
            <p className={gradeColor}>Overspend: −{factors.overspendPenalty} pts</p>
          )}
          {factors.pacePenalty > 0 && (
            <p className={gradeColor}>
              Pace {factors.paceAhead}% ahead: −{factors.pacePenalty} pts
            </p>
          )}
          {factors.incomePenalty > 0 && (
            <p className={gradeColor}>
              Income at {factors.incomePct}%: −{factors.incomePenalty} pts
            </p>
          )}
        </div>
      )}
      <div className="border-t pt-1.5 space-y-0.5">
        <p className="font-medium">Thresholds:</p>
        <p>
          <span className="text-success font-bold">A</span> ≥90 &nbsp;
          <span className="text-success/75 font-bold">B</span> ≥75 &nbsp;
          <span className="text-warning font-bold">C</span> ≥60 &nbsp;
          <span className="text-warning/75 font-bold">D</span> ≥45 &nbsp;
          <span className="text-destructive font-bold">F</span> &lt;45
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex items-center text-xs font-mono tabular-nums">
      {/* Health grade */}
      <ResponsiveTooltip desktopComponent="hovercard" content={tooltipContent} contentClassName="p-3 w-auto max-w-xs">
        <span className={cn('font-bold cursor-help', gradeColor)}>{grade}</span>
      </ResponsiveTooltip>
      <span className="text-muted-foreground/50 ml-0.5">{score}</span>

      <Dot />

      {/* Expenses */}
      <span className="text-muted-foreground/50 mr-1">EXP</span>
      <span className={cn('font-semibold', pctColor)}>{formatBudgetAmount(stats.totalActualExpense, displayCurrency)}</span>
      <span className="text-muted-foreground/40">/{formatBudgetAmount(stats.totalPlannedExpense, displayCurrency)}</span>
      <span className={cn('ml-1', pctColor)}>{stats.percentUsed.toFixed(0)}%</span>

      <Dot />

      {/* Income */}
      <span className="text-muted-foreground/50 mr-1">INC</span>
      <span className="text-success font-semibold">{formatBudgetAmount(stats.totalActualIncome, displayCurrency)}</span>
      {stats.netSavings !== 0 && (
        <span className={cn('ml-1', savingsColor)}>
          {stats.netSavings >= 0 ? '+' : '−'}
          {formatBudgetAmount(Math.abs(stats.netSavings), displayCurrency)}
        </span>
      )}
    </div>
  );
};

export default BudgetHeaderStats;
