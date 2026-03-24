import moment, { type Moment } from 'moment';
import React, { useMemo, useState } from 'react';

import { capitalize } from '@/lib/capitalize';
import { cn } from '@/lib/utils';
import { HeatmapPanel } from '@/features/transactions';
import type { ConvertedValues } from '@/features/transactions';

import type { BudgetDTO, BudgetAnalyticsItem } from '../api/types';
import useBudgetTotals from '../hooks/useBudgetTotals';
import { formatBudgetAmount } from '../utils';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

type HeatmapMode = 'expense' | 'income';

const BudgetHeatmapSection: React.FC<Props> = ({ budget, analytics, displayCurrency, rates }) => {
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('expense');
  const totals = useBudgetTotals(budget, analytics, displayCurrency, rates);

  const heatmapYear = moment(budget.startDate).year();
  const heatmapAfter: Moment = useMemo(() => moment(budget.startDate).startOf('day'), [budget.startDate]);
  const heatmapBefore: Moment = useMemo(() => moment(budget.endDate).endOf('day'), [budget.endDate]);

  const dailyBudget = totals.daysTotal > 0 ? totals.totalPlannedExpense / totals.daysTotal : 0;
  const daysElapsed = Math.max(1, totals.daysElapsed);
  const dailyAvg = totals.totalActualExpense / daysElapsed;
  const expectedByNow = (daysElapsed / totals.daysTotal) * totals.totalPlannedExpense;
  const paceOffset = totals.totalActualExpense - expectedByNow;

  let expensePaceLabel: { text: string; color: string } | null;
  if (totals.totalPlannedExpense === 0) {
    expensePaceLabel = null;
  } else if (paceOffset > 0) {
    expensePaceLabel = {
      text: `${formatBudgetAmount(paceOffset, displayCurrency)} over pace`,
      color: 'text-destructive',
    };
  } else if (paceOffset < -1) {
    expensePaceLabel = {
      text: `${formatBudgetAmount(Math.abs(paceOffset), displayCurrency)} under pace`,
      color: 'text-success',
    };
  } else {
    expensePaceLabel = { text: 'On pace', color: 'text-muted-foreground' };
  }

  const statRows: { label: string; value: string; valueClass?: string }[] =
    heatmapMode === 'expense'
      ? [
          {
            label: 'Budget / day',
            value: dailyBudget > 0 ? formatBudgetAmount(dailyBudget, displayCurrency) : '—',
          },
          {
            label: 'Avg spend / day',
            value: formatBudgetAmount(dailyAvg, displayCurrency),
            valueClass:
              totals.totalPlannedExpense > 0
                ? dailyAvg > dailyBudget
                  ? 'text-destructive'
                  : 'text-success'
                : undefined,
          },
          ...(expensePaceLabel
            ? [{ label: 'Pace', value: expensePaceLabel.text, valueClass: expensePaceLabel.color }]
            : []),
        ]
      : [
          {
            label: 'Planned income',
            value: totals.totalPlannedIncome > 0 ? formatBudgetAmount(totals.totalPlannedIncome, displayCurrency) : '—',
          },
          {
            label: 'Actual income',
            value: formatBudgetAmount(totals.totalActualIncome, displayCurrency),
            valueClass: 'text-success',
          },
        ];

  return (
    <div>
      {/* Mode toggle + heatmap */}
      <div className="flex items-center gap-2 mb-1.5">
        {(['expense', 'income'] as HeatmapMode[]).map((mode) => (
          <button
            aria-pressed={heatmapMode === mode}
            type="button"
            className={cn(
              'text-xs px-2.5 py-0.5 rounded border transition-colors',
              heatmapMode === mode
                ? 'bg-foreground text-background border-foreground'
                : 'text-muted-foreground border-border hover:text-foreground hover:border-foreground/50',
            )}
            key={mode}
            onClick={() => setHeatmapMode(mode)}
          >
            {capitalize(mode)}
          </button>
        ))}
      </div>
      <HeatmapPanel
        currency={displayCurrency}
        filters={{ affectingProfit: true }}
        rangeAfter={heatmapAfter}
        rangeBefore={heatmapBefore}
        selectable={false}
        showControls={false}
        showStats={false}
        viewMode={heatmapMode}
        year={heatmapYear}
      />

      {/* Stats footer */}
      <div className="flex items-center pt-1.5 border-t mt-1.5 text-xs tabular-nums leading-tight divide-x divide-border [&>div]:px-2 first:[&>div]:pl-0">
        {statRows.map(({ label, value, valueClass }) => (
          <div className="flex items-center gap-1" key={label}>
            <span className="text-muted-foreground">{label}</span>
            <span className={cn('font-semibold', valueClass)}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetHeatmapSection;
