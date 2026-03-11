import { History, Loader2 } from 'lucide-react';
import moment from 'moment';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';

import { useHistoryAverages, useUpsertBudgetLine } from '../api';
import type { BudgetDTO } from '../api/types';
import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const HISTORY_MONTHS = 6;

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const BudgetFillFromHistoryButton: React.FC<Props> = ({ budget, displayCurrency, rates }) => {
  const [open, setOpen] = useState(false);

  const { data: historyData, isLoading: historyLoading } = useHistoryAverages(
    open ? budget.id : null,
    HISTORY_MONTHS,
  );
  const { mutateAsync: upsertLine, isPending: isSaving } = useUpsertBudgetLine(budget.id);

  const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));

  // Compute suggestions: average monthly expense per category, only for categories with no existing line
  const suggestions = React.useMemo(() => {
    if (!historyData) return [];

    // Budget period scale factor vs 1 month
    const budgetDays = moment(budget.endDate).diff(moment(budget.startDate), 'days') + 1;
    const scaleFactor = budgetDays / 30;

    return historyData.data
      .filter((item) => !linesMap.has(item.categoryId))
      .map((item) => {
        let totalExpense = 0;
        for (const [cur, cv] of Object.entries(item.convertedValues)) {
          const rate = cur === displayCurrency ? 1 : getExchangeRate(cur, displayCurrency, rates);
          if (rate !== null) totalExpense += cv.expense * rate;
        }
        const monthly = totalExpense / HISTORY_MONTHS;
        const scaled = monthly * scaleFactor;
        return { categoryId: item.categoryId, suggested: scaled };
      })
      .filter((s) => s.suggested > 1);
  }, [historyData, linesMap, displayCurrency, rates, budget]);

  const handleApply = async () => {
    let count = 0;
    for (const s of suggestions) {
      try {
        await upsertLine({
          lineId: null,
          payload: {
            categoryId: s.categoryId,
            plannedAmount: Math.round(s.suggested),
            plannedCurrency: displayCurrency,
          },
        });
        count++;
      } catch {
        // skip failures
      }
    }
    setOpen(false);
    toast.success(`Added ${count} budget lines from history`);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Fill from history" size="icon" variant="outline" onClick={() => setOpen(true)}>
            <History className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fill from last {HISTORY_MONTHS} months</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Fill from history</DialogTitle>
            <DialogDescription>
              Suggested amounts based on average monthly spending over the last {HISTORY_MONTHS} months. Only categories
              without an existing budget line are shown.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto space-y-1 text-sm">
            {historyLoading && (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading history…
              </div>
            )}
            {!historyLoading && suggestions.length === 0 && (
              <p className="text-muted-foreground text-center py-4 text-xs">
                No suggestions — all budgeted categories already have lines, or no historical spending found.
              </p>
            )}
            {suggestions.map((s) => (
              <div key={s.categoryId} className="flex justify-between items-center py-1 border-b last:border-0">
                <span className="text-muted-foreground text-xs">cat #{s.categoryId}</span>
                <span className="font-medium tabular-nums">{fmtAmt(s.suggested, displayCurrency)}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={suggestions.length === 0 || isSaving || historyLoading} onClick={handleApply}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Apply {suggestions.length > 0 ? `(${suggestions.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BudgetFillFromHistoryButton;
