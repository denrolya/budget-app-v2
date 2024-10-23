import MoneyValue from '@/components/common/MoneyValue';
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from 'lucide-react';
import React, { memo, useMemo } from 'react';

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

const ChangeIndicator: React.FC<{ change: number; isExpense?: boolean }> = ({ change, isExpense = false }) => {
  const color = isExpense
    ? change > 0
      ? 'text-destructive'
      : 'text-success'
    : change > 0
      ? 'text-success'
      : 'text-destructive';

  if (change > 0) return <ArrowUpIcon className={`h-3 w-3 ${color}`} />;
  if (change < 0) return <ArrowDownIcon className={`h-3 w-3 ${color}`} />;
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
      {dataToRender.map(({ label, current, previous, change, changePercent }) => (
        <React.Fragment key={label}>
          <div className="text-xs">{label}</div>
          <div className="text-xs font-mono text-right">
            <MoneyValue amount={current} useColors={false} className="text-xs" />
          </div>
          <div className="text-xs font-mono text-right text-muted-foreground">
            <MoneyValue amount={previous} useColors={false} className="text-xs" />
          </div>
          <div className="text-xs font-mono text-right flex items-center justify-end">
            <ChangeIndicator change={change} isExpense={label === 'Expenses'} />
            <span
              className={`ml-1 ${
                label === 'Expenses'
                  ? change > 0
                    ? 'text-destructive'
                    : 'text-success'
                  : change > 0
                    ? 'text-success'
                    : 'text-destructive'
              }`}
            >
                  {Math.abs(changePercent).toFixed(1)}%
                </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default memo(IncomeExpensesComparison);
