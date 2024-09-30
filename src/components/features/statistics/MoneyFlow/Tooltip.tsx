import cn from 'classnames';
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, DollarSignIcon, PercentIcon, TrendingUpIcon } from 'lucide-react';
import moment from 'moment';
import React, { memo, useMemo } from 'react';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import MoneyValue from '@/components/common/MoneyValue';

const DATE_FORMAT = 'MMM D, YYYY HH:mm';

type TransformedData = {
  time: number;
  income: number;
  expenses: number;
  revenue: number;
  date: moment.Moment;
  previousIncome: number;
  previousExpenses: number;
  previousRevenue: number;
};

interface Props extends TooltipProps<ValueType, NameType> {
  data: TransformedData[];
}

const calculateChange = (current: number, previous: number) => {
  const difference = current - previous;
  const percentChange = previous !== 0 ? (difference / Math.abs(previous)) * 100 : 0;
  return {
    difference,
    percentChange,
    isPositive: difference >= 0,
  };
};

export const Tooltip: React.FC<Props> = ({ label, active, payload, data }) => {
  const dataPointMap = useMemo(() => {
    const map = new Map<number, TransformedData>();
    data.forEach((data) => {
      map.set(data.time, data);
    });
    return map;
  }, [data]);

  const dataPoint = useMemo(() => dataPointMap.get(label), [dataPointMap, label]);

  const revenueChange = useMemo(() => {
    if (dataPoint) {
      return calculateChange(dataPoint.revenue, dataPoint.previousRevenue);
    }
    return { difference: 0, percentChange: 0, isPositive: true };
  }, [dataPoint]);

  const incomeChange = useMemo(() => {
    if (dataPoint) {
      return calculateChange(dataPoint.income, dataPoint.previousIncome);
    }
    return { difference: 0, percentChange: 0, isPositive: true };
  }, [dataPoint]);

  const expensesChange = useMemo(() => {
    if (dataPoint) {
      return calculateChange(dataPoint.expenses, dataPoint.previousExpenses);
    }
    return { difference: 0, percentChange: 0, isPositive: true };
  }, [dataPoint]);

  const shouldRender = active && payload && payload.length && dataPoint;

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="bg-background border border-border p-4 rounded-lg shadow-lg max-w-sm">
      <p className="font-bold mb-2 flex items-center">
        <CalendarIcon className="mr-2" size={16} />
        {dataPoint.date.format(DATE_FORMAT)}
      </p>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium flex items-center">
            <TrendingUpIcon className="mr-2" size={16} />
            Revenue
          </p>
          <p className="text-lg font-bold">
            <MoneyValue useColors={false} amount={dataPoint.revenue} />
          </p>
          <div
            className={cn('text-xs flex items-center', {
              'text-success': revenueChange.isPositive,
              'text-destructive': !revenueChange.isPositive,
            })}
          >
            {revenueChange.isPositive ? (
              <ArrowUpIcon className="mr-1" size={12} />
            ) : (
              <ArrowDownIcon className="mr-1" size={12} />
            )}
            <MoneyValue useColors={false} amount={revenueChange.difference} />
            <PercentIcon className="mx-1" size={12} />
            <span>{revenueChange.percentChange.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex justify-between pt-2 border-t border-border">
          <div>
            <p className="text-sm font-medium flex items-center">
              <DollarSignIcon className="mr-2" size={16} />
              Income
            </p>
            <p>
              <MoneyValue useColors={false} amount={dataPoint.income} />
            </p>
            <div
              className={cn('text-xs flex items-center', {
                'text-success': incomeChange.isPositive,
                'text-destructive': !incomeChange.isPositive,
              })}
            >
              {incomeChange.isPositive ? (
                <ArrowUpIcon className="mr-1" size={12} />
              ) : (
                <ArrowDownIcon className="mr-1" size={12} />
              )}
              <MoneyValue useColors={false} amount={incomeChange.difference} />
              <PercentIcon className="mx-1" size={12} />
              <span>{incomeChange.percentChange.toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium flex items-center">
              <DollarSignIcon className="mr-2" size={16} />
              Expenses
            </p>
            <MoneyValue useColors={false} amount={-dataPoint.expenses} />
            <div
              className={cn('text-xs flex items-center', {
                'text-destructive': expensesChange.isPositive,
                'text-success': !expensesChange.isPositive,
              })}
            >
              {expensesChange.isPositive ? (
                <ArrowUpIcon className="mr-1" size={12} />
              ) : (
                <ArrowDownIcon className="mr-1" size={12} />
              )}
              <MoneyValue useColors={false} amount={Math.abs(expensesChange.difference)} />
              <PercentIcon className="mx-1" size={12} />
              <span>{Math.abs(expensesChange.percentChange).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Tooltip.displayName = 'MoneyFlowTooltip';

export default memo(Tooltip);
