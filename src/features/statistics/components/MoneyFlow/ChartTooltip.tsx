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
import type { TransformedData } from '@/types/statistics/moneyFlow';

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

const getDataPointRange = (date: moment.Moment, period: ISO8601Period): PeriodRange => {
  switch (period) {
    case 'P1D':
      return { after: date.clone().startOf('day'), before: date.clone().endOf('day') };
    case 'P1W':
      return { after: date.clone().startOf('isoWeek'), before: date.clone().endOf('isoWeek') };
    case 'P1M':
      return { after: date.clone().startOf('month'), before: date.clone().endOf('month') };
    case 'P3M':
      return { after: date.clone().startOf('month'), before: date.clone().add(2, 'months').endOf('month') };
    case 'P1Y':
      return { after: date.clone().startOf('year'), before: date.clone().endOf('year') };
    default:
      return { after: date.clone(), before: date.clone() };
  }
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

  const isForecastPoint =
    dataPoint != null &&
    dataPoint.income === 0 &&
    dataPoint.expenses === 0 &&
    dataPoint.projectedIncome != null &&
    dataPoint.projectedIncome > 0;

  const comparisonData = useMemo(() => {
    if (!dataPoint || isForecastPoint) return null;

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
  }, [dataPoint, data, label, comparisonMode, isForecastPoint]);

  useEffect(() => {
    const W = 320,
      H = 200,
      M = 12,
      OX = 16,
      OY = 8;
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

  const currentRange = getDataPointRange(dataPoint.date, period);
  const formattedCurrentDate = formatDateRange(currentRange, period);

  const formattedComparisonDate = isForecastPoint
    ? null
    : comparisonMode === 'previousPeriod'
      ? formatDateRange(
          {
            after: moment(dataPoint.date).subtract(1, periodMapping[period]),
            before: moment(dataPoint.date).subtract(1, periodMapping[period]).endOf(periodMapping[period]),
          },
          period,
        )
      : formatDateRange(
          getDataPointRange(
            dataPoint.date.clone().subtract(currentTimeframe.after.diff(previousTimeframe.after, 'ms'), 'ms'),
            period,
          ),
          period,
        );

  return createPortal(
    <Card
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 w-[320px] shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <CardContent className="p-2">
        <p className="text-xs font-medium mb-1">
          {formattedCurrentDate}
          {isForecastPoint ? (
            <span className="text-muted-foreground"> | Forecast</span>
          ) : (
            formattedComparisonDate && <span className="text-muted-foreground"> | {formattedComparisonDate}</span>
          )}
        </p>
        <Separator className="mb-2" />
        {isForecastPoint ? (
          <IncomeExpensesComparison
            currentExpenses={dataPoint.projectedExpenses ?? 0}
            currentIncome={dataPoint.projectedIncome ?? 0}
            previousExpenses={0}
            previousIncome={0}
          />
        ) : (
          <IncomeExpensesComparison
            currentExpenses={dataPoint.expenses}
            currentIncome={dataPoint.income}
            previousExpenses={comparisonData?.expenses ?? 0}
            previousIncome={comparisonData?.income ?? 0}
          />
        )}
      </CardContent>
    </Card>,
    document.body,
  );
};

export default memo(ChartTooltip);
