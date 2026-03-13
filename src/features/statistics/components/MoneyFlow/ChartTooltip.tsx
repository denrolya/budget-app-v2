import moment, { type Moment } from 'moment';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { type TooltipProps } from 'recharts';
import { type NameType, type ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import IncomeExpensesComparison from '@/features/statistics/components/MoneyFlow/IncomeExpensesComparison';
import { formatRange } from '@/lib/datetime/formatShortDate';
import { type ISO8601Period } from '@/types/global';

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

type PeriodRange = { after: moment.Moment; before: moment.Moment };

const periodMapping: Record<ISO8601Period, moment.unitOfTime.DurationConstructor> = {
  P1D: 'day',
  P1W: 'isoWeek' as moment.unitOfTime.DurationConstructor,
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
  payload: _payload,
  label,
  data,
  period,
  currentTimeframe,
  previousTimeframe,
  comparisonMode = 'previousTimeframe',
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const activeRef = useRef(active);
  activeRef.current = active;

  const dataPoint = useMemo(() => data.find((item) => item.timestamp === label), [data, label]);

  const comparisonData = useMemo(() => {
    if (!dataPoint) return null;

    if (comparisonMode === 'previousPeriod') {
      const index = data.findIndex((item) => item.timestamp === label);
      return index > 0 ? data[index - 1] : data.find((item) => item.date.year() === dataPoint.date.year() - 1) || null;
    }

    return {
      ...dataPoint,
      income: dataPoint.previousIncome,
      expenses: dataPoint.previousExpenses,
      revenue: dataPoint.previousRevenue,
    };
  }, [dataPoint, data, label, comparisonMode]);

  useEffect(() => {
    const W = 320, H = 200, M = 12, OX = 16, OY = 8;
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeRef.current) return;
      setPosition({
        top: Math.max(M, Math.min(e.clientY + OY, window.innerHeight - H - M)),
        left: Math.max(M, Math.min(e.clientX + OX, window.innerWidth - W - M)),
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!active || !dataPoint) return null;

  const formattedCurrentDate = formatDateRange(currentTimeframe, period);
  const formattedComparisonDate =
    comparisonMode === 'previousPeriod'
      ? formatDateRange(
          {
            after: moment(dataPoint.date).subtract(1, periodMapping[period]),
            before: moment(dataPoint.date).subtract(1, periodMapping[period]).endOf(periodMapping[period]),
          },
          period,
        )
      : formatDateRange(previousTimeframe, period);

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
