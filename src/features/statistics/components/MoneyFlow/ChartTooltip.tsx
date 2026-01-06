import moment, { Moment } from 'moment';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ISO8601Period } from '@/types/global';
import { formatRange } from '@/lib/datetime/formatShortDate';
import IncomeExpensesComparison from '@/features/statistics/components/MoneyFlow/IncomeExpensesComparison';

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

const periodMapping: Record<ISO8601Period, moment.unitOfTime.DurationConstructor> = {
  P1D: 'day',
  P1W: 'isoWeek',
  P1M: 'month',
  P3M: 'month',
  P1Y: 'year',
};

const formatDateRange = (range: PeriodRange, period: ISO8601Period): string => {
  const { after, before } = range;

  switch (period) {
    case 'P1W':
      return formatRange(range);
    case 'P3M':
      return after.year() === before.year()
        ? `${after.format('MMM')}–${before.format('MMM YYYY')}`
        : `${after.format('MMM YYYY')}–${before.format('MMM YYYY')}`;
    case 'P1M':
      return after.format('MMM YYYY');
    case 'P1Y':
      return after.format('YYYY');
    default:
      return after.format('MMM D, YYYY');
  }
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
  const { x = 0, y = 0 } = coordinate || {};

  const dataPoint = useMemo(() => data.find((item) => item.timestamp === label), [data, label]);

  const comparisonData = useMemo(() => {
    if (!dataPoint) return null;

    if (comparisonMode === 'previousPeriod') {
      const index = data.findIndex((item) => item.timestamp === label);
      return index > 0
        ? data[index - 1]
        : data.find((item) => item.date.year() === dataPoint.date.year() - 1) || null;
    }

    return {
      ...dataPoint,
      income: dataPoint.previousIncome,
      expenses: dataPoint.previousExpenses,
      revenue: dataPoint.previousRevenue,
    };
  }, [dataPoint, data, label, comparisonMode]);

  useEffect(() => {
    if (!active || !payload?.length || !dataPoint) return;

    const tooltipSize = { width: 320, height: 200 };
    const margin = 0;

    const top = Math.min(y, window.innerHeight - tooltipSize.height - margin);
    const left = Math.min(x, window.innerWidth - tooltipSize.width - margin);

    setPosition({
      top: Math.max(margin, top),
      left: Math.max(margin, left),
    });
  }, [active, payload, dataPoint, x, y]);

  if (!active || !dataPoint) return null;

  const formattedCurrentDate = formatDateRange(dataPoint.currentPeriod, period);
  const formattedComparisonDate =
    comparisonMode === 'previousPeriod'
      ? formatDateRange(
        {
          after: moment(dataPoint.date).subtract(1, periodMapping[period]),
          before: moment(dataPoint.date).subtract(1, periodMapping[period]).endOf(periodMapping[period]),
        },
        period,
      )
      : formatDateRange(dataPoint.comparisonPeriod, period);

  return createPortal(
    <Card
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 w-[320px] shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <CardContent className="p-2">
        <p className="text-xs font-medium mb-1">
          {formattedCurrentDate}
          <span className="text-muted-foreground"> | {formattedComparisonDate}</span>
        </p>
        <Separator className="mb-2" />
        <IncomeExpensesComparison
          currentExpenses={dataPoint.expenses}
          currentIncome={dataPoint.income}
          previousExpenses={comparisonData?.expenses || 0}
          previousIncome={comparisonData?.income || 0}
        />
      </CardContent>
    </Card>,
    document.body,
  );
};

export default memo(ChartTooltip);
