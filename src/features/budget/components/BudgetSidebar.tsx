import moment from 'moment';
import { Plus, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { confirm } from '@/lib/confirmation';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';

import { useListBudgets, useDeleteBudget, useBudgetSummaries } from '../api';
import type { BudgetDTO, BudgetPeriodType, BudgetSummaryItem } from '../api/types';
import { computeHealthScore, fmtBudgetAmt } from '../hooks/useBudgetTotals';

import BudgetCreateDialog from './BudgetCreateDialog';

interface Props {
  selectedId: string | null;
}

const BASE_CURRENCY = 'EUR';

const formatBudgetLabel = (budget: BudgetDTO): string => {
  if (budget.name) return budget.name;
  if (budget.periodType === 'monthly') return moment(budget.startDate).format('MMMM YYYY');
  if (budget.periodType === 'yearly') return moment(budget.startDate).format('YYYY');
  return `${moment(budget.startDate).format('MMM D')} – ${moment(budget.endDate).format('MMM D, YYYY')}`;
};

const PERIOD_LABELS: Record<BudgetPeriodType, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

const PERIOD_ORDER: BudgetPeriodType[] = ['monthly', 'yearly', 'custom'];

// Actuals from the backend are already available in every currency (convertedValues).
// Just pick the base currency value — no need to sum/convert across currencies (that would double-count).
const pickCurrency = (amounts: Record<string, number>, currency: string): number => amounts[currency] ?? 0;

// Planned amounts are in their native currency — need conversion to base currency.
const convertPlanned = (amounts: Record<string, number>, rates: ConvertedValues | null): number => {
  let total = 0;
  for (const [currency, amount] of Object.entries(amounts)) {
    if (currency === BASE_CURRENCY) {
      total += amount;
    } else {
      const rate = getExchangeRate(currency, BASE_CURRENCY, rates);
      if (rate !== null) total += amount * rate;
    }
  }
  return total;
};

interface SidebarMetrics {
  grade: string;
  gradeColor: string;
  score: number;
  percentUsed: number;
  totalActualExpense: number;
  totalPlannedExpense: number;
  totalActualIncome: number;
  totalPlannedIncome: number;
  remaining: number;
  netSavings: number;
  daysLeft: number;
  isCompleted: boolean;
}

const computeSidebarMetrics = (
  budget: BudgetDTO,
  summary: BudgetSummaryItem,
  rates: ConvertedValues | null,
): SidebarMetrics => {
  const totalActualExpense = pickCurrency(summary.actualExpense, BASE_CURRENCY);
  const totalActualIncome = pickCurrency(summary.actualIncome, BASE_CURRENCY);
  const totalPlannedExpense = convertPlanned(summary.plannedExpense, rates);
  const totalPlannedIncome = convertPlanned(summary.plannedIncome, rates);
  const percentUsed = totalPlannedExpense > 0 ? (totalActualExpense / totalPlannedExpense) * 100 : 0;

  const start = moment(budget.startDate);
  const end = moment(budget.endDate);
  const today = moment();
  const daysTotal = end.diff(start, 'days') + 1;
  const daysElapsed = Math.max(0, Math.min(today.diff(start, 'days') + 1, daysTotal));
  const daysLeft = Math.max(0, end.diff(today, 'days'));
  const isCompleted = today.isAfter(end, 'day');

  const { grade, gradeColor, score } = computeHealthScore(
    percentUsed,
    daysElapsed,
    daysTotal,
    totalPlannedIncome,
    totalActualIncome,
  );

  return {
    grade,
    gradeColor,
    score,
    percentUsed,
    totalActualExpense,
    totalPlannedExpense,
    totalActualIncome,
    totalPlannedIncome,
    remaining: totalPlannedExpense - totalActualExpense,
    netSavings: totalActualIncome - totalActualExpense,
    daysLeft,
    isCompleted,
  };
};

const BudgetSidebar: React.FC<Props> = ({ selectedId }) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data } = useListBudgets();
  const { mutate: deleteBudget } = useDeleteBudget();
  const { data: summariesData } = useBudgetSummaries();
  const { data: ratesData } = useExchangeRatesQuery();

  const budgets = data ?? [];
  const rates = ratesData?.fixer ?? null;

  const summaryMap = useMemo(() => {
    const map = new Map<number, BudgetSummaryItem>();
    for (const item of summariesData?.data ?? []) {
      map.set(item.budgetId, item);
    }
    return map;
  }, [summariesData]);

  const grouped = PERIOD_ORDER.reduce<Record<BudgetPeriodType, BudgetDTO[]>>(
    (acc, periodType) => {
      acc[periodType] = budgets
        .filter((budget) => budget.periodType === periodType)
        .sort((a, b) => b.startDate.localeCompare(a.startDate));
      return acc;
    },
    { monthly: [], yearly: [], custom: [] },
  );

  const handleCreated = (budget: BudgetDTO, fillFromHistory?: boolean) => {
    navigate(`/budget/${budget.id}`, fillFromHistory ? { state: { fillFromHistory: true } } : undefined);
  };

  const handleDelete = async (event: React.MouseEvent, budget: BudgetDTO) => {
    event.stopPropagation();
    const ok = await confirm({
      title: 'Delete budget?',
      description: `Delete "${formatBudgetLabel(budget)}"? This will remove all planned lines.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!ok) return;
    deleteBudget(budget.id, {
      onSuccess: () => {
        if (String(budget.id) === selectedId) navigate('/budget');
      },
    });
  };

  const renderBudgetItem = (budget: BudgetDTO) => {
    const isSelected = String(budget.id) === selectedId;
    const summary = summaryMap.get(budget.id);
    const metrics = summary ? computeSidebarMetrics(budget, summary, rates) : null;

    const barPct = metrics ? Math.min(metrics.percentUsed, 100) : 0;
    const barColor =
      metrics && metrics.percentUsed > 100
        ? 'bg-destructive'
        : metrics && metrics.percentUsed > 80
          ? 'bg-warning'
          : 'bg-primary';

    const isCompleted = metrics?.isCompleted ?? moment(budget.endDate).isBefore(moment(), 'day');
    const pctColor =
      metrics && metrics.percentUsed > 100
        ? 'text-destructive'
        : metrics && metrics.percentUsed > 80
          ? 'text-warning'
          : '';
    const remainingColor = metrics && metrics.remaining < 0 ? 'text-destructive' : 'text-success';

    const tooltipContent = metrics ? (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Expenses</span>
          <span>
            <span className={cn('font-medium', pctColor)}>
              {fmtBudgetAmt(metrics.totalActualExpense, BASE_CURRENCY)}
            </span>
            {metrics.totalPlannedExpense > 0 && (
              <span className="text-muted-foreground">
                {' '}
                / {fmtBudgetAmt(metrics.totalPlannedExpense, BASE_CURRENCY)}
              </span>
            )}
          </span>
        </div>
        {(metrics.totalActualIncome > 0 || metrics.totalPlannedIncome > 0) && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Income</span>
            <span>
              <span className="font-medium text-success">{fmtBudgetAmt(metrics.totalActualIncome, BASE_CURRENCY)}</span>
              {metrics.totalPlannedIncome > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  / {fmtBudgetAmt(metrics.totalPlannedIncome, BASE_CURRENCY)}
                </span>
              )}
            </span>
          </div>
        )}
        <div className="border-t border-border/40 my-1" />
        {metrics.totalPlannedExpense > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Remaining</span>
            <span className={cn('font-medium', remainingColor)}>
              {metrics.remaining < 0 ? '-' : ''}
              {fmtBudgetAmt(Math.abs(metrics.remaining), BASE_CURRENCY)}
            </span>
          </div>
        )}
        {metrics.totalActualIncome > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Savings</span>
            <span className={cn('font-medium', metrics.netSavings >= 0 ? 'text-success' : 'text-destructive')}>
              {metrics.netSavings >= 0 ? '+' : '-'}
              {fmtBudgetAmt(Math.abs(metrics.netSavings), BASE_CURRENCY)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Score</span>
          <span className={cn('font-bold', metrics.gradeColor)}>
            {metrics.grade} ({metrics.score})
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Status</span>
          <span className={isCompleted ? 'text-muted-foreground' : ''}>
            {isCompleted ? 'Completed' : `Active · ${metrics.daysLeft}d left`}
          </span>
        </div>
      </div>
    ) : null;

    const rowContent = (
      <div
        className={cn(
          'group relative hover:bg-accent transition-colors',
          isSelected && 'bg-accent',
          isCompleted && !isSelected && 'opacity-60',
        )}
        key={budget.id}
      >
        <button
          type="button"
          className="w-full text-left px-3 py-1.5 min-w-0"
          onClick={() => navigate(`/budget/${budget.id}`)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn('text-sm truncate flex-1', isSelected && 'font-medium')}>
              {formatBudgetLabel(budget)}
            </span>
            {metrics && (
              <span className={cn('text-xs font-bold tabular-nums shrink-0 leading-none', metrics.gradeColor)}>
                {metrics.grade}
              </span>
            )}
          </div>
          {metrics && metrics.totalPlannedExpense > 0 && (
            <div className="h-1 rounded-full bg-muted overflow-hidden mt-1">
              <div style={{ width: `${barPct}%` }} className={cn('h-full rounded-full transition-all', barColor)} />
            </div>
          )}
        </button>
        <button
          aria-label="Delete budget"
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded bg-accent text-muted-foreground hover:text-destructive transition-all"
          onClick={(event) => handleDelete(event, budget)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );

    if (!tooltipContent) return <React.Fragment key={budget.id}>{rowContent}</React.Fragment>;

    return (
      <Tooltip key={budget.id}>
        <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="bg-background text-foreground border shadow-md text-xs p-3 tabular-nums min-w-[200px]"
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between px-3 py-3 border-b shrink-0">
          <span className="text-sm font-semibold">Budgets</span>
          <Button
            aria-label="New budget"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="py-2">
            {PERIOD_ORDER.map((periodType) => {
              const items = grouped[periodType];
              if (items.length === 0) return null;
              return (
                <div className="mb-2" key={periodType}>
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {PERIOD_LABELS[periodType]}
                  </p>
                  {items.map(renderBudgetItem)}
                </div>
              );
            })}

            {budgets.length === 0 && (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">No budgets yet.</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setDialogOpen(true)}>
                  Create first budget
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <BudgetCreateDialog budgets={budgets} open={dialogOpen} onCreated={handleCreated} onOpenChange={setDialogOpen} />
    </>
  );
};

export default BudgetSidebar;
