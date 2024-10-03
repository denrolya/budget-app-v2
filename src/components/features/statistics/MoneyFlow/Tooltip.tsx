import cn from 'classnames';
import { ArrowRightIcon, TrendingUpIcon } from 'lucide-react';
import moment from 'moment';
import React, { memo, useMemo } from 'react';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import MoneyValue from '@/components/common/MoneyValue.tsx';
import ArrowChangeIndicator from '@/components/common/ArrowChangeIndicator';

interface TransformedData {
  time: number;
  income: number;
  expenses: number;
  revenue: number;
  date: moment.Moment;
  previousIncome: number;
  previousExpenses: number;
  previousRevenue: number;
}

interface Props extends TooltipProps<ValueType, NameType> {
  data: TransformedData[];
  currentTimeframe: { after: moment.Moment; before: moment.Moment };
  previousTimeframe: { after: moment.Moment; before: moment.Moment };
  interval: '1 day' | '1 week' | '1 month';
}

const calculateChange = (current: number, previous: number) => {
  const value = current - previous;
  const percentage = previous !== 0 ? (value / Math.abs(previous)) * 100 : 0;
  return {
    value,
    percentage,
  };
};

const formatDate = (date: moment.Moment, interval: '1 day' | '1 week' | '1 month'): string => {
  switch (interval) {
    case '1 day':
      return date.format('MMM D, YYYY');
    case '1 week':
      return `Week of ${date.format('MMM D, YYYY')}`;
    case '1 month':
      return date.format('MMMM YYYY');
  }
};

export const Tooltip: React.FC<Props> = ({
                                           active,
                                           payload,
                                           label,
                                           data,
                                           currentTimeframe,
                                           previousTimeframe,
                                           interval,
                                         }) => {
  const dataPointMap = useMemo(() => {
    const map = new Map<number, TransformedData>();
    data.forEach((item) => {
      map.set(item.time, item);
    });
    return map;
  }, [data]);

  const dataPoint = useMemo(() => dataPointMap.get(label as number), [dataPointMap, label]);

  const changes = useMemo(() => {
    if (dataPoint) {
      return {
        revenue: calculateChange(dataPoint.revenue, dataPoint.previousRevenue),
        income: calculateChange(dataPoint.income, dataPoint.previousIncome),
        expenses: calculateChange(dataPoint.expenses, dataPoint.previousExpenses),
      };
    }
    return {
      revenue: { value: 0, percentage: 0 },
      income: { value: 0, percentage: 0 },
      expenses: { value: 0, percentage: 0 },
    };
  }, [dataPoint]);

  const comparisonDate = useMemo(() => {
    if (dataPoint) {
      const currentDate = dataPoint.date;
      const diffDays = currentDate.diff(currentTimeframe.after, 'days');
      return previousTimeframe.after.clone().add(diffDays, 'days');
    }
    return null;
  }, [dataPoint, currentTimeframe, previousTimeframe]);

  if (!active || !payload || !payload.length || !dataPoint || !comparisonDate) {
    return null;
  }

  const formattedCurrentDate = formatDate(dataPoint.date, interval);
  const formattedComparisonDate = formatDate(comparisonDate, interval);

  return (
    <div className="bg-background border border-border p-4 rounded-lg shadow-lg max-w-md space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg border-b pb-2 dark:border-gray-700">
          Summary for <span>{formattedCurrentDate}</span>
          <span className="block text-sm font-normal mt-1">
            <span>Compared to {formattedComparisonDate}</span>
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center">
          <ArrowRightIcon className="h-4 w-4 mr-2" />
          Current vs Previous
        </h4>
        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm">
          <p>Income</p>
          <p className="text-right">
            <MoneyValue
              useColors={false}
              showSign={false}
              className="text-xs font-mono"
              amount={dataPoint.income} />
          </p>
          <p className="text-right">
            <MoneyValue
              useColors={false}
              showSign={false}
              className="text-xs font-mono"
              amount={dataPoint.previousIncome} />
          </p>
          <p>Expenses</p>
          <p className="text-right">
            <MoneyValue
              useColors={false}
              showSign={false}
              className="text-xs font-mono"
              amount={dataPoint.expenses} />
          </p>
          <p className="text-right">
            <MoneyValue
              useColors={false}
              showSign={false}
              className="text-xs font-mono"
              amount={dataPoint.previousExpenses} />
          </p>
          <p className="font-medium">Revenue</p>
          <p className="text-right font-medium">
            <MoneyValue
              useColors
              showSign
              className="text-xs font-mono"
              amount={dataPoint.revenue} />
          </p>
          <p className="text-right font-medium">
            <MoneyValue
              useColors
              showSign
              className="text-xs font-mono"
              amount={dataPoint.previousRevenue} />
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center">
          <TrendingUpIcon className="h-4 w-4 mr-2" />
          Changes
        </h4>
        <div className="space-y-1 text-sm">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span>Income:</span>
              <span className={cn('flex items-center text-xs font-mono', {
                'text-muted-foreground': changes.income.value === 0,
                'text-success': changes.income.value > 0,
                'text-destructive': changes.income.value < 0,
              })}>
                <MoneyValue useColors showSign amount={changes.income.value} />
                {' '}
                (<ArrowChangeIndicator value={changes.income.value} />
                {Math.abs(changes.income.percentage).toFixed(0)}%)
            </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Expenses:</span>
              <span className={cn('flex items-center text-xs font-mono', {
                'text-muted-foreground': changes.expenses.value === 0,
                'text-destructive': changes.expenses.value > 0,
                'text-success': changes.expenses.value < 0,
              })}>
                <MoneyValue showSign revertColors amount={changes.expenses.value} />
                {' '}
                (<ArrowChangeIndicator value={changes.expenses.value} />
                {Math.abs(changes.expenses.percentage).toFixed(0)}%)
            </span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Revenue:</span>
              <span className={cn('flex items-center font-medium text-xs font-mono', {
                'text-muted-foreground': changes.revenue.value === 0,
                'text-success': changes.revenue.value > 0,
                'text-destructive': changes.revenue.value < 0,
              })}>
                <MoneyValue showSign amount={changes.revenue.value} />
                {' '}
                (<ArrowChangeIndicator value={changes.revenue.value} />
                {Math.abs(changes.revenue.percentage).toFixed(0)}%)
            </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Tooltip);
