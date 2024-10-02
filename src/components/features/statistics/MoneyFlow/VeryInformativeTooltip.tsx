import React from 'react';
import moment from 'moment';
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, CalendarIcon, TrendingUpIcon } from 'lucide-react';

import MoneyValue from '@/components/common/MoneyValue';

interface VeryInformativeTooltipProps {
  currentDateRange: { after: moment.Moment; before: moment.Moment }
  previousDateRange: { after: moment.Moment; before: moment.Moment }
  totalIncome: number
  totalExpenses: number
  totalRevenue: number
  previousTotalIncome: number
  previousTotalExpenses: number
  previousTotalRevenue: number
  incomeChange: number
  incomeChangePercent: number
  expensesChange: number
  expensesChangePercent: number
  change: number
  changePercent: number
}

const VeryInformativeTooltip: React.FC<VeryInformativeTooltipProps> = ({
                                                                     currentDateRange,
                                                                     previousDateRange,
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
                                                                     change,
                                                                     changePercent,
                                                                   }) => {
  const formatShortDate = (date: moment.Moment) => {
    const now = moment();
    if (date.year() === now.year()) {
      return date.format('MMM D');
    } else {
      return date.format('MMM D, YYYY');
    }
  };

  const renderChangeIndicator = (value: number) => value >= 0 ? (
      <ArrowUpIcon className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 text-destructive" />
    );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg border-b pb-2 dark:border-gray-700">Comparison Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span className="font-medium">Current period:</span>
        </div>
        <p>{formatShortDate(currentDateRange.after)} - {formatShortDate(currentDateRange.before)}</p>
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span className="font-medium">Previous period:</span>
        </div>
        <p>{formatShortDate(previousDateRange.after)} - {formatShortDate(previousDateRange.before)}</p>
      </div>
      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center">
          <ArrowRightIcon className="h-4 w-4 mr-2" />
          Current vs Previous
        </h4>
        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm">
          <p>Income</p>
          <p className="text-right"><MoneyValue amount={totalIncome} className="font-medium" useColors={false} /></p>
          <p className="text-right"><MoneyValue amount={previousTotalIncome} useColors={false} /></p>
          <p>Expenses</p>
          <p className="text-right"><MoneyValue amount={totalExpenses} className="font-medium" useColors={false} /></p>
          <p className="text-right"><MoneyValue amount={previousTotalExpenses} useColors={false} /></p>
          <p className="font-medium">Revenue</p>
          <p className="text-right"><MoneyValue useColors className="font-medium" amount={totalRevenue} /></p>
          <p className="text-right"><MoneyValue useColors className="font-medium" amount={previousTotalRevenue} /></p>
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
            <span className="flex items-center">
              <MoneyValue amount={incomeChange} showSign useColors />
              {' '}
              ({incomeChangePercent.toFixed(0)}%)
              {renderChangeIndicator(incomeChange)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Expenses:</span>
            <span className="flex items-center">
              <MoneyValue amount={expensesChange} showSign useColors={false} />
              {' '}
              ({expensesChangePercent.toFixed(0)}%)
              {renderChangeIndicator(-expensesChange)}
            </span>
          </div>
          <div className="flex justify-between items-center font-medium">
            <span>Revenue:</span>
            <span className="flex items-center">
              <MoneyValue amount={change} showSign useColors />
              {' '}
              ({changePercent.toFixed(0)}%)
              {renderChangeIndicator(change)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VeryInformativeTooltip;
