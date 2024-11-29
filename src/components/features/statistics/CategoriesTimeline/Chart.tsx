import { ResponsiveLine } from '@nivo/line';
import moment, { Moment } from 'moment';
import { useTheme } from 'next-themes';
import React, { useMemo } from 'react';

import ChartTooltip from '@/components/features/statistics/CategoriesTimeline/ChartTooltip';
import { CURRENCIES } from '@/constants/currency';
import { useBaseCurrency } from '@/contexts/auth';
import { ISO8601Period } from '@/types/global';

interface CategoryData {
  date: Moment;
  value: number;
}

interface Props {
  data: Array<{
    [category: string]: CategoryData[];
  }>;
  selectedPeriod: ISO8601Period;
}

export const CategoryTimelineChart: React.FC<Props> = ({ data, selectedPeriod }) => {
  const baseCurrencyCode = useBaseCurrency();
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    if (!data) return [];

    return Object
      .entries(data)
      .map(([category, values]) => ({
        id: category,
        data: (values as unknown as CategoryData[])
          .filter((item: CategoryData) => item.date && moment(item.date).isValid() && !isNaN(item.value))
          .map((item: CategoryData) => ({
            x: moment(item.date).toDate(),
            y: item.value,
            originalDate: item.date,
          })),
      }))
      .filter((series) => series.data.length > 0);
  }, [data]);

  const getSeriesInterval = (serieId: string) => {
    const hash = serieId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 6) + 1;
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
        tooltip={({ point }) => (<ChartTooltip
          point={point}
          data={chartData}
          selectedPeriod={selectedPeriod}
        />)}
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
      />
    </div>
  );
};

export default CategoryTimelineChart;
