import mapValues from 'lodash/mapValues';
import sumBy from 'lodash/sumBy';
import moment, { Moment } from 'moment';
import React, { useMemo, useState } from 'react';
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

import { MoneyValue } from '@/components/common/MoneyValue';
import { BACKEND_DATE_FORMAT, MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import { CHART_STYLES } from '@/constants/recharts';
import { useCategories } from '@/hooks/financeData';
import { useTheme } from '@/contexts/theme';
import { ISO8601Period } from '@/types/global';
import { cn } from '@/lib/utils';
import ChartTooltip from '@/features/statistics/components/CategoriesTimeline/ChartTooltip';

const colors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
  'hsl(var(--chart-9))',
  'hsl(var(--chart-10))',
];

const getColor = (category: string, index: number) => {
  if (category === 'Total Expense') return 'hsl(var(--destructive) / 0.7)';
  if (category === 'Total Income') return 'hsl(var(--success) / 0.7)';
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
  useSeparateAxisForTotals?: boolean;
}

export const CategoryTimelineChart: React.FC<Props> = ({
  chartType = 'line',
  showComparisonInTooltip = true,
  data,
  selectedPeriod,
  onClick,
  useSeparateAxisForTotals = true,
}) => {
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const { list: allCategories } = useCategories();
  const { theme } = useTheme();

  const getCategoryDepth = (categoryName: string) => {
    const category = allCategories.find((cat) => cat.name === categoryName);
    return category ? category.getFullPath().length : 1;
  };

  const getStrokeWidth = (categoryName: string) => {
    const depth = getCategoryDepth(categoryName);
    return Math.max(2, 6 - depth);
  };

  const totals = useMemo(
    () => mapValues(data, (values) => sumBy(values as unknown as CategoryData[], 'value')),
    [data],
  );

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

    if (selectedPeriod.startsWith('P') && selectedPeriod.endsWith('Y')) {
      label = date.format('YY');
    } else if (selectedPeriod.startsWith('P') && selectedPeriod.endsWith('M')) {
      label = date.format('MMM');
      if (date.year() !== moment().year()) {
        label += ` ${date.format('YY')}`;
      }
    } else if (selectedPeriod === 'P1W') {
      label = date.week() % 3 === 0 ? `W${date.week()}` : '';
    } else if (selectedPeriod === 'P1D') {
      label = date.week() % 3 === 0 ? date.format('D MMM') : '';
    } else {
      label = date.format(MOMENT_DATE_VIEW_FORMAT);
    }

    return label;
  };

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    setHiddenSeries((prev) => (prev.includes(dataKey) ? prev.filter((key) => key !== dataKey) : [...prev, dataKey]));
  };

  const categories = Object.keys(data);
  const regularCategories = categories.filter((cat) => cat !== 'Total Income' && cat !== 'Total Expense');
  const totalCategories = categories.filter((cat) => cat === 'Total Income' || cat === 'Total Expense');

  return (
    <div className="w-full h-full min-w-[600px]">
      <ResponsiveContainer height={385} width="100%">
        <ChartComponent
          barCategoryGap={chartType === 'bar' ? '20%' : undefined}
          barGap={chartType === 'bar' ? 2 : undefined}
          data={chartData}
          margin={{ top: 0, right: useSeparateAxisForTotals ? -30 : 0, bottom: 0, left: -30 }}
          onClick={onClick}
        >
          <defs>
            <linearGradient id="fadeGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="10%" stopColor="rgba(255,255,255,1)" />
              <stop offset="90%" stopColor="rgba(255,255,255,1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_STYLES.cartesianGrid} />
          <XAxis dataKey="date" tickFormatter={formatXAxis} {...CHART_STYLES.xAxis} />
          <YAxis yAxisId="regular" {...CHART_STYLES.yAxis} />
          {useSeparateAxisForTotals && <YAxis orientation="right" yAxisId="total" {...CHART_STYLES.yAxis} />}
          <Tooltip
            content={(props) => (
              <ChartTooltip selectedPeriod={selectedPeriod} showComparison={showComparisonInTooltip} {...props} />
            )}
          />
          <Legend
            formatter={(value) => (
              <span className={`${hiddenSeries.includes(value) ? 'opacity-50' : ''}`}>
                {value} (<MoneyValue amount={totals[value] || 0} useColors={false} className="text-xs font-mono" />)
              </span>
            )}
            onClick={handleLegendClick}
          />
          {regularCategories.map((category, index) => (
            <DataComponent
              dataKey={category}
              dot={{ r: 3, fill: getColor(category, index), strokeWidth: 0 }}
              fill={getColor(category, index)}
              hide={hiddenSeries.includes(category)}
              stackId="a"
              stroke={getColor(category, index)}
              strokeWidth={getStrokeWidth(category)}
              type="monotone"
              yAxisId="regular"
              activeDot={{
                r: 6,
                fill: getColor(category, index),
                strokeWidth: 2,
                stroke: theme === 'dark' ? '#000' : '#fff',
              }}
              className={cn({
                'recharts-line fade-line': chartType === 'line',
                'recharts-bar': chartType === 'bar',
              })}
              key={category}
            />
          ))}
          {totalCategories.map((category, index) => (
            <DataComponent
              dataKey={category}
              fill={getColor(category, regularCategories.length + index)}
              hide={hiddenSeries.includes(category)}
              stroke={getColor(category, regularCategories.length + index)}
              strokeDasharray="15 8"
              strokeOpacity={0.4}
              strokeWidth={1}
              type="monotone"
              yAxisId={useSeparateAxisForTotals ? 'total' : 'regular'}
              activeDot={
                chartType === 'line'
                  ? {
                      r: 6,
                      fill: getColor(category, regularCategories.length + index),
                      strokeWidth: 2,
                      stroke: theme === 'dark' ? '#000' : '#fff',
                    }
                  : undefined
              }
              dot={
                chartType === 'line'
                  ? {
                      r: 2,
                      fill: getColor(category, regularCategories.length + index),
                      strokeWidth: 0,
                    }
                  : undefined
              }
              className={cn({
                'recharts-line fade-line': chartType === 'line',
                'recharts-bar': chartType === 'bar',
              })}
              key={category}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryTimelineChart;
