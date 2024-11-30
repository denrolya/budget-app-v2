import { MoneyValue } from '@/components/common/MoneyValue';
import ChartTooltip from '@/components/features/statistics/CategoriesTimeline/ChartTooltip';
import moment from 'moment';
import React, { useMemo } from 'react';
import _ from 'lodash'; // Import lodash
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { BACKEND_DATE_FORMAT, MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import { CHART_STYLES } from '@/constants/recharts';
import { ISO8601Period } from '@/types/global';

interface CategoryData {
  date: moment.Moment;
  value: number;
}

interface Props {
  chartType: 'line' | 'bar';
  data: Array<{
    [category: string]: CategoryData[];
  }>;
  selectedPeriod: ISO8601Period;
}

export const CategoryTimelineChart: React.FC<Props> = ({ chartType = 'line', data, selectedPeriod }) => {
  // Calculate totals using lodash
  const totals = useMemo(() => {
    return _.mapValues(data, (values) =>
      _.sumBy(values as unknown as CategoryData[], 'value')
    );
  }, [data]);

  const chartData = useMemo(() => {
    if (!data) return [];

    const allDates = new Set<string>();
    const categoryData: { [category: string]: { [date: string]: number } } = {};

    Object.entries(data).forEach(([category, values]) => {
      (values as unknown as CategoryData[]).forEach((item) => {
        if (item.date && moment(item.date).isValid() && !isNaN(item.value)) {
          const dateStr = moment(item.date).format('YYYY-MM-DD');
          allDates.add(dateStr);
          if (!categoryData[category]) categoryData[category] = {};
          categoryData[category][dateStr] = item.value;
        }
      });
    });

    return Array.from(allDates)
      .sort()
      .map((date) => {
        const point: any = { date };
        Object.keys(categoryData).forEach((category) => {
          point[category] = categoryData[category][date] || 0;
        });
        return point;
      });
  }, [data]);

  const formatXAxis = (tickItem: string) => {
    const date = moment(tickItem, BACKEND_DATE_FORMAT);
    let label = '';

    switch (selectedPeriod) {
      case 'P1M':
        label = date.format('MMM');
        break;
      case 'P1W':
        label = date.week() % 3 === 0 ? `W${date.week()}` : '';
        break;
      case 'P1D':
        label = date.week() % 3 === 0 ? date.format('D MMM') : '';
        break;
      default:
        label = date.format(MOMENT_DATE_VIEW_FORMAT);
    }

    return label;
  };

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  return (
    <div className="w-full h-full min-w-[600px]">
      <ResponsiveContainer width="100%" height={385}>
        <ChartComponent
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: -30 }}
        >
          <CartesianGrid {...CHART_STYLES.cartesianGrid} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            {...CHART_STYLES.xAxis}
          />
          <YAxis {...CHART_STYLES.yAxis} />
          <Tooltip content={(props) => <ChartTooltip selectedPeriod={selectedPeriod} {...props} />} />
          <Legend
            formatter={(value) => (
              <span>
                {value} (<MoneyValue className="text-xs font-mono" useColors={false} amount={totals[value] || 0} />)
              </span>
            )}
          />
          {Object.keys(data).map((category, index) => (
            <DataComponent
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              dot={chartType === 'line' ? { r: 1.5, fill: colors[index % colors.length], strokeWidth: 0 } : undefined}
              activeDot={chartType === 'line' ? { r: 4 } : undefined}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryTimelineChart;
