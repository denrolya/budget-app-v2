import { Info } from 'lucide-react';
import React from 'react';

import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { cn } from '@/lib/utils';

import type { SeasonalItem } from '../api/types';
import { formatBudgetAmount, formatPercent } from '../utils';

interface Props {
  baseAmount: number;
  trendFactor: number;
  seasonalFactor: number;
  displayCurrency: string;
  budgetMonth: string;
  seasonal: SeasonalItem | undefined;
}

const BudgetAdjustmentTooltip: React.FC<Props> = ({
  baseAmount,
  trendFactor,
  seasonalFactor,
  displayCurrency,
  budgetMonth,
  seasonal,
}) => {
  if (trendFactor === 1 && seasonalFactor === 1) return null;

  const total = trendFactor * seasonalFactor;
  const adjusted = Math.round(baseAmount * total);

  return (
    <ResponsiveTooltip
      desktopComponent="hovercard"
      content={
        <table className="border-collapse text-xs tabular-nums">
          <tbody>
            <tr>
              <td className="pr-3 text-muted-foreground">Weighted avg</td>
              <td className="text-right">{formatBudgetAmount(baseAmount, displayCurrency)}/mo</td>
            </tr>
            {trendFactor !== 1 && (
              <tr>
                <td className="pr-3 text-muted-foreground">Trend (last 3mo vs prior 3mo)</td>
                <td className={cn('text-right', trendFactor > 1 ? 'text-destructive' : 'text-success')}>
                  {formatPercent(Math.round((trendFactor - 1) * 100))}
                </td>
              </tr>
            )}
            {seasonal && seasonalFactor !== 1 && (
              <tr>
                <td className="pr-3 text-muted-foreground">
                  {budgetMonth} seasonal ({seasonal.sampleYears}yr history)
                </td>
                <td className={cn('text-right', seasonalFactor > 1 ? 'text-warning' : 'text-success')}>
                  {seasonalFactor}x
                </td>
              </tr>
            )}
            <tr className="border-t border-border/40">
              <td className="pr-3 pt-1 font-medium">Prediction</td>
              <td className="text-right pt-1 font-medium">{formatBudgetAmount(adjusted, displayCurrency)}</td>
            </tr>
          </tbody>
        </table>
      }
      contentClassName="p-2.5 w-auto"
    >
      <button type="button" className="text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0">
        <Info className="h-3 w-3" />
      </button>
    </ResponsiveTooltip>
  );
};

export default BudgetAdjustmentTooltip;
