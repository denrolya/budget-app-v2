import { Info } from 'lucide-react';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';

import type { SeasonalItem } from '../api/types';

interface Props {
  baseAmount: number;
  trendFactor: number;
  seasonalFactor: number;
  displayCurrency: string;
  budgetMonth: string;
  seasonal: SeasonalItem | undefined;
}

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const fmtPct = (n: number) => `${n > 0 ? '+' : ''}${n}%`;

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
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
        >
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4} className="text-xs p-2.5 tabular-nums">
        <table className="border-collapse">
          <tbody>
            <tr>
              <td className="pr-3 text-muted-foreground">Weighted avg</td>
              <td className="text-right">{fmtAmt(baseAmount, displayCurrency)}/mo</td>
            </tr>
            {trendFactor !== 1 && (
              <tr>
                <td className="pr-3 text-muted-foreground">Trend (last 3mo vs prior 3mo)</td>
                <td className={`text-right ${trendFactor > 1 ? 'text-destructive' : 'text-success'}`}>
                  {fmtPct(Math.round((trendFactor - 1) * 100))}
                </td>
              </tr>
            )}
            {seasonal && seasonalFactor !== 1 && (
              <tr>
                <td className="pr-3 text-muted-foreground">
                  {budgetMonth} seasonal ({seasonal.sampleYears}yr history)
                </td>
                <td className={`text-right ${seasonalFactor > 1 ? 'text-warning' : 'text-success'}`}>
                  {seasonalFactor}x
                </td>
              </tr>
            )}
            <tr className="border-t border-border/40">
              <td className="pr-3 pt-1 font-medium">Prediction</td>
              <td className="text-right pt-1 font-medium">{fmtAmt(adjusted, displayCurrency)}</td>
            </tr>
          </tbody>
        </table>
      </TooltipContent>
    </Tooltip>
  );
};

export default BudgetAdjustmentTooltip;
