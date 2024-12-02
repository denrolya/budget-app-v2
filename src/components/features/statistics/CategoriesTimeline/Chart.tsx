import moment, { Moment } from 'moment';
import React, { useMemo, useState } from 'react';
import sumBy from 'lodash/sumBy';
import mapValues from 'lodash/mapValues';
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

import ChartTooltip from '@/components/features/statistics/CategoriesTimeline/ChartTooltip';
import { MoneyValue } from '@/components/common/MoneyValue';
import { BACKEND_DATE_FORMAT, MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import { CHART_STYLES } from '@/constants/recharts';
import { ISO8601Period } from '@/types/global';

const colors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const getColor = (category: string, index: number) => {
  if (category === 'Total Expense') return 'hsl(var(--destructive))';
  if (category === 'Total Income') return 'hsl(var(--success))';
  return colors[index % colors.length];
};

interface CategoryData {
  date: Moment;
  value: number;
}

interface Props {
  chartType: 'line' | 'bar';
  showComparisonInTooltip?: boolean;
  data: Array<{
    [category: string]: CategoryData[];
  }>;
  selectedPeriod: ISO8601Period;
  onClick?: (data: any, index: number) => void;
}

export const CategoryTimelineChart: React.FC<Props> = ({ chartType = 'line', showComparisonInTooltip = true, data, selectedPeriod, onClick }) => {
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const totals = useMemo(() => mapValues(data, (values) =>
    sumBy(values as unknown as CategoryData[], 'value')
  ), [data]);

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

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    setHiddenSeries((prev) =>
      prev.includes(dataKey) ? prev.filter((key) => key !== dataKey) : [...prev, dataKey]
    );
  };

  const renderLegendIcon = (color: string) => chartType === 'line' ? (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="2"/>
        <circle cx="7" cy="7" r="3" fill={color}/>
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="14" height="14" fill={color}/>
      </svg>
    );

  return (
    <div className="w-full h-full min-w-[600px]">
      <ResponsiveContainer width="100%" height={385}>
        <ChartComponent
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: -30 }}
          onClick={onClick}
        >
          <CartesianGrid {...CHART_STYLES.cartesianGrid} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            {...CHART_STYLES.xAxis}
          />
          <YAxis {...CHART_STYLES.yAxis} />
          <Tooltip content={(props) => <ChartTooltip selectedPeriod={selectedPeriod} showComparison={showComparisonInTooltip} {...props} />} />
          <Legend
            onClick={handleLegendClick}
            formatter={(value, entry) => (
              <span className={`flex items-center gap-2 ${hiddenSeries.includes(value) ? 'opacity-50' : ''}`}>
                {renderLegendIcon(entry.color)}
                {value} (<MoneyValue className="text-xs font-mono" useColors={false} amount={totals[value] || 0} />)
              </span>
            )}
          />
          {Object.keys(data).map((category, index) => (
            <DataComponent
              key={category}
              type="monotone"
              dataKey={category}
              stroke={getColor(category, index)}
              fill={getColor(category, index)}
              dot={chartType === 'line' ? { r: 1.5, fill: colors[index % colors.length], strokeWidth: 0 } : undefined}
              activeDot={chartType === 'line' ? { r: 4 } : undefined}
              hide={hiddenSeries.includes(category)}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryTimelineChart;
