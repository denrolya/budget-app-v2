import moment from 'moment/moment';
import React, { useMemo } from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import { ISO8601Period } from '@/types/global';

interface CustomTooltipProps {
  point: {
    data: PointData;
    serieId: string;
  };
  data: Array<{
    id: string;
    data: PointData[];
  }>;
  selectedPeriod: ISO8601Period;
}

const ChartTooltip = ({ active, payload, label, selectedPeriod }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const currentDate = moment(label);
  const formattedDate = useMemo(() => {
    switch (selectedPeriod) {
      case 'P1D':
        return currentDate.format('MMMM D, YYYY');
      case 'P1W':
        const startOfWeek = currentDate.clone().startOf('isoWeek');
        const endOfWeek = currentDate.clone().endOf('isoWeek');
        const endFormat = startOfWeek.year() !== endOfWeek.year()
          ? 'MMM D, YYYY'
          : startOfWeek.month() !== endOfWeek.month()
            ? 'MMM D'
            : 'D';

        return `Week ${currentDate.isoWeek()}: ${startOfWeek.format('MMM D, YYYY')} - ${endOfWeek.format(endFormat)}`;
      case 'P1M':
        return currentDate.format('MMMM YYYY');
      default:
        return currentDate.format(MOMENT_DATE_VIEW_FORMAT);
    }
  }, [currentDate, selectedPeriod]);

  return (
    <Card className="w-[320px] shadow-lg z-10 p-4">
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-medium">{formattedDate}</p>
        </div>
        <Separator className="mb-2" />
        <div className="space-y-1">
        {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center" style={{ color: entry.color }}>
              <span className="text-sm font-medium">{entry.name}</span>
              <MoneyValue className="font-mono font-medium text-xs" useColors={false} amount={entry.value} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartTooltip;
