import moment from 'moment';
import React from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';
import { type ISO8601Period } from '@/types/global';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  selectedPeriod: ISO8601Period;
  showComparison?: boolean;
}

const ChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  selectedPeriod,
  showComparison = true,
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const currentDate = moment(label);
  if (!currentDate.isValid()) return null;

  const formatDate = (): string => {
    switch (selectedPeriod) {
      case 'P1D':
        return currentDate.format('MMM D, YYYY');
      case 'P1W': {
        const startOfWeek = currentDate.clone().startOf('isoWeek');
        const endOfWeek = currentDate.clone().endOf('isoWeek');
        let endFormat = 'D';
        if (startOfWeek.year() !== endOfWeek.year()) {
          endFormat = 'MMM D, YYYY';
        } else if (startOfWeek.month() !== endOfWeek.month()) {
          endFormat = 'MMM D';
        }
        return `W${currentDate.isoWeek()}: ${startOfWeek.format('MMM D')} - ${endOfWeek.format(endFormat)}`;
      }
      case 'P1M':
        return currentDate.format('MMM YYYY');
      default:
        return currentDate.format(MOMENT_DATE_VIEW_FORMAT);
    }
  };
  const formattedDate = formatDate();

  const totalExpense = payload.find((entry) => entry.name === 'Total Expense');
  const totalIncome = payload.find((entry) => entry.name === 'Total Income');

  const renderEntry = (entry: NonNullable<CustomTooltipProps['payload']>[number]) => {
    const isTotal = entry.name === 'Total Expense' || entry.name === 'Total Income';
    if (isTotal) return null;

    const expensePercentage = totalExpense && totalExpense.value !== 0 ? (entry.value / totalExpense.value) * 100 : 0;
    const incomePercentage = totalIncome && totalIncome.value !== 0 ? (entry.value / totalIncome.value) * 100 : 0;

    return (
      <div style={{ color: entry.color }} className="flex justify-between items-center text-xs" key={entry.name}>
        <span className="font-medium truncate mr-2">{entry.name}</span>
        <div className="text-right flex items-center">
          <MoneyValue amount={entry.value} useColors={false} className="font-mono font-medium" />
          {showComparison && (
            <div className="flex flex-col ml-1">
              {totalExpense && totalExpense.value !== 0 && (
                <div className="flex items-center">
                  <span className="min-w-[30px] text-right">{expensePercentage.toFixed(0)}%</span>
                  <div className="ml-1 w-8 bg-muted rounded-full h-1 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(expensePercentage, 100)}%` }}
                      className="bg-destructive rounded-full h-1"
                    ></div>
                  </div>
                </div>
              )}
              {totalIncome && totalIncome.value !== 0 && (
                <div className="flex items-center mt-0.5">
                  <span className="min-w-[30px] text-right">{incomePercentage.toFixed(0)}%</span>
                  <div className="ml-1 w-8 bg-muted rounded-full h-1 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(incomePercentage, 100)}%` }}
                      className="bg-success rounded-full h-1"
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getComparisonColor = (ratio: number) => {
    if (ratio <= 0.5) return 'bg-success';
    if (ratio <= 0.8) return 'bg-warning';
    return 'bg-destructive';
  };

  const totalComparison =
    totalExpense && totalIncome && totalIncome.value !== 0 ? totalExpense.value / totalIncome.value : null;

  return (
    <Card className="w-[280px] shadow-lg z-10">
      <CardContent className="p-2">
        <p className="text-xs font-medium mb-1">{formattedDate}</p>
        <Separator className="my-1" />
        <div className="space-y-1">{payload.map(renderEntry)}</div>
        {(totalExpense || totalIncome) && (
          <>
            <Separator className="my-1" />
            <div className="text-xs">
              {totalExpense && (
                <div style={{ color: totalExpense.color }} className="flex justify-between items-center">
                  <span className="font-medium">Expenses:</span>
                  <MoneyValue amount={totalExpense.value} useColors={false} className="font-mono font-medium" />
                </div>
              )}
              {totalIncome && (
                <div style={{ color: totalIncome.color }} className="flex justify-between items-center">
                  <span className="font-medium">Income:</span>
                  <MoneyValue amount={totalIncome.value} useColors={false} className="font-mono font-medium" />
                </div>
              )}
              {showComparison && totalComparison !== null && (
                <div className="flex items-center justify-between mt-1 text-muted-foreground">
                  <span className="font-medium">Ratio:</span>
                  <div className="flex items-center">
                    <span className="mr-1">{(totalComparison * 100).toFixed(0)}%</span>
                    <div className="w-12 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(totalComparison * 100, 100)}%` }}
                        className={cn('rounded-full h-1.5', getComparisonColor(totalComparison))}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartTooltip;
