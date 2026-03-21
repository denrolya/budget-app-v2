import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from 'lucide-react';
import React, { memo, useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import { cn } from '@/lib/utils';

interface Props {
  currentIncome: number;
  currentExpenses: number;
  previousIncome: number;
  previousExpenses: number;
}

const calculateChange = (current: number, previous: number) => {
  const value = current - previous;
  const percentage = previous !== 0 ? (value / Math.abs(previous)) * 100 : 0;
  return { value, percentage };
};

const getChangeColor = (change: number, isExpense: boolean): string => {
  if (change === 0) return 'text-muted-foreground';
  const isPositive = change > 0;
  return isExpense === isPositive ? 'text-destructive' : 'text-success';
};

const ChangeIndicator: React.FC<{ change: number; isExpense?: boolean }> = ({ change, isExpense = false }) => {
  const color = getChangeColor(change, isExpense);
  if (change > 0) return <ArrowUpIcon className={cn('h-3 w-3', color)} />;
  if (change < 0) return <ArrowDownIcon className={cn('h-3 w-3', color)} />;
  return <ArrowRightIcon className="h-3 w-3 text-muted-foreground" />;
};

const IncomeExpensesComparison: React.FC<Props> = ({
  currentIncome,
  currentExpenses,
  previousIncome,
  previousExpenses,
}) => {
  const changes = useMemo(() => {
    const currentRevenue = currentIncome - currentExpenses;
    const previousRevenue = previousIncome - previousExpenses;

    return {
      income: calculateChange(currentIncome, previousIncome),
      expenses: calculateChange(currentExpenses, previousExpenses),
      revenue: calculateChange(currentRevenue, previousRevenue),
    };
  }, [currentIncome, currentExpenses, previousIncome, previousExpenses]);

  const dataToRender = [
    {
      label: 'Income',
      current: currentIncome,
      previous: previousIncome,
      change: changes.income.value,
      changePercent: changes.income.percentage,
    },
    {
      label: 'Expenses',
      current: currentExpenses,
      previous: previousExpenses,
      change: changes.expenses.value,
      changePercent: changes.expenses.percentage,
    },
    {
      label: 'Revenue',
      current: currentIncome - currentExpenses,
      previous: previousIncome - previousExpenses,
      change: changes.revenue.value,
      changePercent: changes.revenue.percentage,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="text-2xs text-muted-foreground" />
      <div className="text-2xs text-muted-foreground text-right">Now</div>
      <div className="text-2xs text-muted-foreground text-right">Prev</div>
      <div className="text-2xs text-muted-foreground text-right">Δ</div>
      {dataToRender.map(({ label, current, previous, change, changePercent }) => (
        <React.Fragment key={label}>
          <div className="text-xs">{label}</div>
          <div className="text-xs font-mono text-right">
            <MoneyValue amount={current} showSign={current < 0} useColors={false} className="text-xs" />
          </div>
          <div className="text-xs font-mono text-right text-muted-foreground">
            <MoneyValue amount={previous} showSign={previous < 0} useColors={false} className="text-xs" />
          </div>
          <div className="text-xs font-mono text-right flex items-center justify-end">
            <ChangeIndicator change={change} isExpense={label === 'Expenses'} />
            <span className={cn('ml-1', getChangeColor(change, label === 'Expenses'))}>
              {Math.abs(changePercent).toFixed(1)}%
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default memo(IncomeExpensesComparison);
