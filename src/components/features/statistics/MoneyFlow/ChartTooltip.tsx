import moment, { Moment } from 'moment';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import IncomeExpensesComparison from '@/components/features/statistics/MoneyFlow/IncomeExpensesComparison';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MOMENT_DATE_GENERIC_FORMAT } from '@/constants/datetime';
import { ISO8601Period } from '@/types/global';

interface TransformedData {
  timestamp: number;
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
  period: ISO8601Period;
  comparisonMode?: 'previousPeriod' | 'previousTimeframe';
}

const formatDate = (date: Moment, period: ISO8601Period): string => {
  switch (period) {
    case 'P1D':
      return date.format('MMM D, YYYY');
    case 'P1W':
      return date.format('MMM D');
    case 'P1M':
      return date.format('MMM YYYY');
    default:
      return date.format(MOMENT_DATE_GENERIC_FORMAT);
  }
};

const periodMapping: Record<ISO8601Period, moment.unitOfTime.DurationConstructor> = {
  P1D: 'day',
  P1W: 'week',
  P1M: 'month',
  P3M: 'month',
  P1Y: 'year',
};

export const ChartTooltip: React.FC<Props> = ({
                                                active,
                                                payload,
                                                label,
                                                data,
                                                period,
                                                coordinate,
                                                comparisonMode = 'previousTimeframe',
                                              }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { x = 0, y = 0 } = coordinate || { x: 0, y: 0 };

  const dataPoint = useMemo(() => data.find((item) => item.timestamp === label), [data, label]);

  const comparisonData = useMemo(() => {
    if (!dataPoint) return null;

    if (comparisonMode === 'previousPeriod') {
      const currentIndex = data.findIndex((item) => item.timestamp === label);
      if (currentIndex > 0) {
        return data[currentIndex - 1];
      } else {
        const previousYearData = data.filter((item) => item.date.year() === dataPoint.date.year() - 1);
        return previousYearData.length > 0 ? previousYearData[previousYearData.length - 1] : null;
      }
    } else {
      return {
        ...dataPoint,
        income: dataPoint.previousIncome,
        expenses: dataPoint.previousExpenses,
        revenue: dataPoint.previousRevenue,
      };
    }
  }, [label, dataPoint, data, comparisonMode]);

  useEffect(() => {
    if (active && payload && payload.length && dataPoint) {
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      const margin = 0;

      let top = Math.min(y, window.innerHeight - tooltipHeight - margin);
      let left = Math.min(x, window.innerWidth - tooltipWidth - margin);

      top = Math.max(margin, top);
      left = Math.max(margin, left);

      setPosition({ top, left });
    }
  }, [active, payload, dataPoint, x, y]);

  if (!active || !dataPoint) return null;

  const formattedCurrentDate = formatDate(dataPoint.date, period);

  let formattedComparisonDate: string;

  if (comparisonMode === 'previousPeriod') {
    const unit = periodMapping[period] || 'month';
    formattedComparisonDate = formatDate(moment(dataPoint.date).subtract(1, unit), period);
  } else {
    formattedComparisonDate = formatDate(dataPoint.date, period);
  }

  return createPortal(
    <Card
      className="fixed z-50 w-[320px] shadow-lg"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <CardContent className="p-2">
        <p className="text-xs font-medium mb-1">{formattedCurrentDate} <span className="text-muted-foreground">| {formattedComparisonDate}</span></p>
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

export default memo(ChartTooltip);
