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

const ChartTooltip: React.FC<CustomTooltipProps> = ({ point, data, selectedPeriod }) => {
  const currentDate = moment(point.data.x);

  const formattedDate = useMemo(() => {
    switch (selectedPeriod) {
      case 'P1D':
        return currentDate.format('MMMM D, YYYY');
      case 'P1W':
        const startOfWeek = currentDate.clone().startOf('isoWeek');
        const endOfWeek = currentDate.clone().endOf('isoWeek');
        const startFormat = 'MMM D';
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

  const allSeriesData = useMemo(() => data.map(serie => ({
    id: serie.id,
    value: serie.data.find(d => moment(d.x).isSame(currentDate, 'day'))?.y || 0,
  })), [data, currentDate]);

  return (
    <Card className="w-[320px] shadow-lg z-10">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium">{formattedDate}</p>
        </div>
        <Separator className="mb-2" />
        <div className="space-y-2">
          {allSeriesData.map((serie) => (
            <div key={serie.id} className="flex justify-between items-center">
              <span className="text-sm font-medium">{serie.id}</span>
              <MoneyValue className="font-mono text-xs" useColors={false} amount={serie.value} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartTooltip;
