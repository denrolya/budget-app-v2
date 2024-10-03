
import cn from 'classnames';
import { ArrowRightIcon, TrendingUpIcon } from 'lucide-react';
import moment from 'moment';
import React from 'react';

import { formatShortDate } from '@/utils/formatShortDate';
import MoneyValue from '@/components/common/MoneyValue';
import ArrowChangeIndicator from '@/components/common/ArrowChangeIndicator';

interface VeryInformativeTooltipProps {
  currentTimeframe: { after: moment.Moment; before: moment.Moment };
  previousTimeframe: { after: moment.Moment; before: moment.Moment };
  totalIncome: number;
  totalExpenses: number;
  totalRevenue: number;
  previousTotalIncome: number;
  previousTotalExpenses: number;
  previousTotalRevenue: number;
  incomeChange: number;
  incomeChangePercent: number;
  expensesChange: number;
  expensesChangePercent: number;
  revenueChange: number;
  revenueChangePercent: number;
}

const VeryInformativeTooltip: React.FC<VeryInformativeTooltipProps> = ({
                                                                         currentTimeframe,
                                                                         previousTimeframe,
                                                                         totalIncome,
                                                                         totalExpenses,
                                                                         totalRevenue,
                                                                         previousTotalIncome,
                                                                         previousTotalExpenses,
                                                                         previousTotalRevenue,
                                                                         incomeChange,
                                                                         incomeChangePercent,
                                                                         expensesChange,
                                                                         expensesChangePercent,
                                                                         revenueChange,
                                                                         revenueChangePercent,
                                                                       }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-lg border-b pb-2 dark:border-gray-700">
      Summary for <span>{formatShortDate(currentTimeframe.after)} - {formatShortDate(currentTimeframe.before)}</span>
      <span className="block text-sm font-normal mt-1">
          <span>Compared to {formatShortDate(previousTimeframe.after)} - {formatShortDate(previousTimeframe.before)}</span>
      </span>
    </h3>
    <div className="space-y-2">
      <h4 className="font-medium text-sm flex items-center">
        <ArrowRightIcon className="h-4 w-4 mr-2" />
        Current vs Previous
      </h4>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm">
        <p>Income</p>
        <p className="text-right">
          <MoneyValue
            className="font-medium text-xs font-mono"
            useColors={false}
            amount={totalIncome} />
        </p>
        <p className="text-right">
          <MoneyValue
            useColors={false}
            className="text-xs font-mono"
            amount={previousTotalIncome} /></p>
        <p>Expenses</p>
        <p className="text-right">
          <MoneyValue
            className="font-medium text-xs font-mono"
            useColors={false}
            amount={totalExpenses} />
        </p>
        <p className="text-right">
          <MoneyValue
            useColors={false}
            className="text-xs font-mono"
            amount={previousTotalExpenses} />
        </p>
        <p className="font-medium">Revenue</p>
        <p className="text-right">
          <MoneyValue
            useColors
            showSign
            className="font-medium text-xs font-mono"
            amount={totalRevenue} />
        </p>
        <p className="text-right">
          <MoneyValue
            useColors
            showSign
            className="font-medium text-xs font-mono"
            amount={previousTotalRevenue} />
        </p>
      </div>
    </div>
    <div className="space-y-2">
      <h4 className="font-medium text-sm flex items-center">
        <TrendingUpIcon className="h-4 w-4 mr-2" />
        Changes
      </h4>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between items-center">
          <span>Income:</span>
          <span className={cn('flex items-center text-xs font-mono', {
            'text-muted-foreground': incomeChange === 0,
            'text-success': incomeChange > 0,
            'text-destructive': incomeChange < 0,
          })}>
            <MoneyValue showSign useColors amount={incomeChange} />
            {' '}
            (<ArrowChangeIndicator value={incomeChange} />
            {Math.abs(incomeChangePercent).toFixed(0)}%)
            </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Expenses:</span>
          <span className={cn('flex items-center text-xs font-mono', {
            'text-muted-foreground': expensesChange === 0,
            'text-destructive': expensesChange > 0,
            'text-success': expensesChange < 0,
          })}>
            <MoneyValue showSign revertColors amount={expensesChange} />
            {' '}
            (<ArrowChangeIndicator value={expensesChange} />
            {Math.abs(expensesChangePercent).toFixed(0)}%)
            </span>
        </div>
        <div className="flex justify-between items-center font-medium">
          <span>Revenue:</span>
          <span className={cn('flex items-center font-medium text-xs font-mono', {
            'text-muted-foreground': revenueChange === 0,
            'text-success': revenueChange > 0,
            'text-destructive': revenueChange < 0,
          })}>
              <MoneyValue showSign amount={revenueChange} />
            {' '}
            (<ArrowChangeIndicator value={revenueChange} />
            {Math.abs(revenueChangePercent).toFixed(0)}%)
            </span>
        </div>
      </div>
    </div>
  </div>
);

export default VeryInformativeTooltip;
