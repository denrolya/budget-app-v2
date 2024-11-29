
import { MoneyValue } from '@/components/common/MoneyValue';
import { MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import { ResponsiveLine } from '@nivo/line';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import moment from 'moment';
import { useTheme } from 'next-themes';
import React, { useMemo } from 'react';

import { useBaseCurrency } from '@/contexts/auth';
import { CURRENCIES } from '@/constants/currency';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

interface CustomTooltipProps {
  point: {
    data: PointData;
    serieId: string;
  };
  data: Array<{
    id: string;
    data: PointData[];
  }>;
  selectedPeriod: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ point, data, selectedPeriod }) => {
  const baseCurrencyCode = useBaseCurrency();
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
      value: serie.data.find(d => moment(d.x).isSame(currentDate, 'day'))?.y || 0
    })), [data, currentDate]);

  return (
    <Card className="w-[320px] shadow-lg">
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

export const CategoryTimelineChart: React.FC<{ data: any; selectedPeriod: string }> = ({ data, selectedPeriod }) => {
  const baseCurrencyCode = useBaseCurrency();
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    if (!data) return [];

    return Object.entries(data).map(([category, values]) => ({
      id: category,
      data: values
        .filter((item) => item.date && moment(item.date).isValid() && !isNaN(item.value))
        .map((item) => ({
          x: moment(item.date).toDate(),
          y: item.value,
          originalDate: item.date,
        })),
    })).filter((series) => series.data.length > 0);
  }, [data]);

  const getSeriesInterval = (serieId: string) => {
    const hash = serieId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 5) + 1;
  };

  const formatMoney = ({ data, serieId, index }) => {
    const interval = getSeriesInterval(serieId);
    if (index % interval === 0) {
      return `${CURRENCIES[baseCurrencyCode].symbol}${Number(data.y).toFixed(2)}`;
    }
    return '';
  };

  return (
    <div className="h-[450px] relative" aria-live="polite">
      <ResponsiveLine
        data={chartData}
        margin={{ top: 50, right: 10, bottom: 30, left: 50 }}
        xScale={{
          type: 'time',
          format: 'native',
          precision: 'day',
        }}
        xFormat="time:%Y-%m-%d"
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
          reverse: false,
        }}
        axisBottom={{
          format: (value) => {
            const date = new Date(value);
            return selectedPeriod === 'P1D'
              ? date.getDate().toString()
              : selectedPeriod === 'P1W'
                ? `W${moment(date).isoWeek()}`
                : selectedPeriod === 'P1M'
                  ? moment(date).format('MMM')
                  : moment(date).format('YYYY');
          },
          tickValues: 5,
          tickSize: 5,
          tickPadding: 5,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          tickValues: 5,
          format: (value) => `${CURRENCIES[baseCurrencyCode].symbol}${value}`,
        }}
        enableGridX={false}
        enableGridY={true}
        axisTop={null}
        axisRight={null}
        pointSize={5}
        gridYValues={5}
        enablePointLabel={true}
        pointLabel={formatMoney}
        pointColor={{ from: 'color', modifiers: [] }}
        pointBorderWidth={2}
        pointBorderColor={{ theme: 'background' }}
        pointLabelYOffset={-12}
        useMesh={true}
        legends={[
          {
            anchor: 'top-left',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: -30,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 10,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        theme={{
          axis: {
            ticks: { text: { fontSize: 12, fill: theme === 'dark' ? '#ffffff' : '#000000' } },
            domain: { line: { stroke: theme === 'dark' ? '#ffffff' : '#000000', strokeWidth: 1 } },
          },
          crosshair: {
            line: {
              stroke: theme === 'dark' ? '#ffffff' : '#000000',
              strokeWidth: 1,
              strokeOpacity: 0.75,
              strokeDasharray: '6 6',
            },
          },
          grid: {
            line: {
              stroke: theme === 'dark' ? '#333333' : '#dddddd',
              strokeWidth: 0.5,
            },
          },
          tooltip: {
            container: {
              background: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#000000',
              fontSize: 12,
            },
          },
        }}
        tooltip={({ point }) => (<CustomTooltip point={point} data={chartData} selectedPeriod={selectedPeriod} />)}
      />
    </div>
  );
};

export default CategoryTimelineChart;
