import { Download } from 'lucide-react';
import moment from 'moment';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';

import type { BudgetAnalyticsItem, BudgetDTO } from '../api/types';
import { getAllDescendantIds } from '../utils';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const BudgetExportButton: React.FC<Props> = ({ budget, analytics, displayCurrency, rates }) => {
  const { data: catData } = useCategoryList();

  const handleExport = () => {
    if (!catData) return;

    const currencySymbol = CURRENCIES[displayCurrency as CURRENCY_CODE]?.symbol ?? displayCurrency;
    const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));
    const analyticsMap = new Map(analytics.map((a) => [a.categoryId, a]));

    const getActual = (cat: Category, isExpense: boolean): number => {
      let total = 0;
      for (const id of getAllDescendantIds(cat)) {
        const item = analyticsMap.get(id);
        if (!item) continue;
        const cv = item.convertedValues[displayCurrency];
        if (cv) total += isExpense ? cv.expense : cv.income;
      }
      return total;
    };

    const rows: string[][] = [
      [`Budget: ${budget.name ?? '(no name)'}`],
      [`Period: ${moment(budget.startDate).format('YYYY-MM-DD')} – ${moment(budget.endDate).format('YYYY-MM-DD')}`],
      [`Currency: ${displayCurrency}`],
      [],
      ['Category', 'Type', `Planned (${currencySymbol})`, `Actual (${currencySymbol})`, `Remaining (${currencySymbol})`, '% Used'],
    ];

    const addCat = (cat: Category, type: 'Expense' | 'Income', depth = 0) => {
      if (!cat.isAffectingProfit) return;
      const isExpense = type === 'Expense';
      const actual = getActual(cat, isExpense);
      const line = linesMap.get(cat.id);
      const rate = line ? getExchangeRate(line.plannedCurrency, displayCurrency, rates) : null;
      const planned = rate !== null && line ? line.plannedAmount * rate : null;
      const remaining = planned !== null ? (isExpense ? planned - actual : actual - planned) : null;
      const pct = planned !== null && planned > 0 ? (actual / planned) * 100 : null;
      const indent = '  '.repeat(depth);

      rows.push([
        `${indent}${cat.name}`,
        type,
        planned !== null ? planned.toFixed(2) : '',
        actual > 0 ? actual.toFixed(2) : '0.00',
        remaining !== null ? remaining.toFixed(2) : '',
        pct !== null ? `${pct.toFixed(1)}%` : '',
      ]);

      for (const child of cat.children) addCat(child, type, depth + 1);
    };

    catData.tree
      .filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense)
      .forEach((c) => addCat(c, 'Expense'));

    rows.push([]);

    catData.tree
      .filter((c) => c.isAffectingProfit && c.type === CategoryType.Income)
      .forEach((c) => addCat(c, 'Income'));

    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${budget.id}-${displayCurrency}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label="Export CSV" size="icon" variant="ghost" className="h-7 w-7" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Export CSV</TooltipContent>
    </Tooltip>
  );
};

export default BudgetExportButton;
