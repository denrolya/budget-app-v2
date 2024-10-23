import moment, { Moment } from 'moment';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import IncomeExpensesComparison from '@/components/features/statistics/MoneyFlow/IncomeExpensesComparison';

interface TransformedData {
  time: number;
  income: number;
  expenses: number;
  revenue: number;
  date: Moment;
  previousIncome: number;
  previousExpenses: number;
  previousRevenue: number;
}

interface Props extends TooltipProps<ValueType, NameType> {
  data: TransformedData[];
  currentTimeframe: { after: Moment; before: Moment };
  previousTimeframe: { after: Moment; before: Moment };
  interval: '1 day' | '1 week' | '1 month';
  comparisonMode?: 'previousInterval' | 'previousTimeframe';
}

const formatDate = (date: Moment, interval: '1 day' | '1 week' | '1 month'): string => {
  switch (interval) {
    case '1 day':
      return date.format('MMM D, YYYY');
    case '1 week':
      return date.format('MMM D');
    case '1 month':
      return date.format('MMM YYYY');
  }
};

export const Tooltip: React.FC<Props> = ({
                                           active,
                                           payload,
                                           label,
                                           data,
                                           interval,
                                           coordinate,
                                           comparisonMode = 'previousInterval',
                                         }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { x, y } = coordinate || { x: 0, y: 0 };

  const dataPoint = useMemo(() => data.find((item) => item.time === label), [data, label]);

  const comparisonData = useMemo(() => {
    if (!dataPoint) return null;

    if (comparisonMode === 'previousInterval') {
      const currentIndex = data.findIndex((item) => item.time === label);
      if (currentIndex > 0) {
        return data[currentIndex - 1];
      } else {
        const previousYearData = data.filter((item) => item.date.year() === dataPoint.date.year() - 1);
        return previousYearData.length > 0 ? previousYearData[previousYearData.length - 1] : null;
      }
    } else {
      const currentDate = dataPoint.date;
      const comparisonDate = moment(currentDate).subtract(1, 'year');
      return data.find((item) => item.date.isSame(comparisonDate, 'day')) || null;
    }
  }, [label, dataPoint, data, comparisonMode]);

  useEffect(() => {
    if (active && payload && payload.length && dataPoint) {
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      const margin = 10;

      let top = Math.min(y, window.innerHeight - tooltipHeight - margin);
      let left = Math.min(x, window.innerWidth - tooltipWidth - margin);

      top = Math.max(margin, top);
      left = Math.max(margin, left);

      setPosition({ top, left });
    }
  }, [active, payload, dataPoint, x, y]);

  if (!active || !dataPoint) return null;

  const formattedCurrentDate = formatDate(dataPoint.date, interval);
  const formattedComparisonDate = comparisonData
    ? formatDate(comparisonData.date, interval)
    : formatDate(moment(dataPoint.date).subtract(1, interval), interval);

  return createPortal(
    <Card
      className="fixed z-50 w-[320px] shadow-lg p-4"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-medium">{formattedCurrentDate}</p>
          <p className="text-xs text-muted-foreground">{formattedComparisonDate}</p>
        </div>
        <Separator className="mb-2" />
        <IncomeExpensesComparison
          currentIncome={dataPoint.income}
          currentExpenses={dataPoint.expenses}
          previousIncome={comparisonData?.income || 0}
          previousExpenses={comparisonData?.expenses || 0}
        />
      </CardContent>
    </Card>,
    document.body,
  );
};

export default memo(Tooltip);
