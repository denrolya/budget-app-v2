import mapValues from 'lodash/mapValues';
import sumBy from 'lodash/sumBy';
import moment, { type Moment } from 'moment';
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
import { CHART_COLORS, CHART_STYLES } from '@/constants/recharts';
import { useCategories } from '@/hooks/financeData';
import { type ISO8601Period } from '@/types/global';
import { cn } from '@/lib/utils';
import ChartTooltip from '@/features/statistics/components/CategoriesTimeline/ChartTooltip';

const getColor = (category: string, index: number) => {
  if (category === 'Total Expense') return 'hsl(var(--destructive) / 0.7)';
  if (category === 'Total Income') return 'hsl(var(--success) / 0.7)';
  return CHART_COLORS[index % CHART_COLORS.length];
};

interface CategoryData {
  date: Moment;
  value: number;
}

type TimelineDataProcessed = {
  [category: string]: CategoryData[];
};

interface Props {
  chartType: 'line' | 'bar';
  showComparisonInTooltip?: boolean;
  data: TimelineDataProcessed;
  selectedPeriod: ISO8601Period;
  onClick?: (data: Record<string, unknown>, index: number) => void;
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
        const point: Record<string, string | number> = { date };
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

  const ChartComponent = (chartType === 'line' ? LineChart : BarChart) as React.ElementType;
  const DataComponent = (chartType === 'line' ? Line : Bar) as React.ElementType;

  const handleLegendClick = (data: { dataKey?: string | number | ((obj: unknown) => unknown) }) => {
    const dataKey = typeof data.dataKey === 'string' ? data.dataKey : undefined;
    if (!dataKey) return;
    setHiddenSeries((prev) => (prev.includes(dataKey) ? prev.filter((key) => key !== dataKey) : [...prev, dataKey]));
  };

  const categories = Object.keys(data);
  const regularCategories = useMemo(
    () => categories.filter((cat) => cat !== 'Total Income' && cat !== 'Total Expense'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );
  const totalCategories = useMemo(
    () => categories.filter((cat) => cat === 'Total Income' || cat === 'Total Expense'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  return (
    <div className="chart-enter w-full h-full min-w-[600px]">
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
              <stop offset="0%" style={{ stopColor: 'hsl(var(--card) / 0)' }} />
              <stop offset="10%" style={{ stopColor: 'hsl(var(--card))' }} />
              <stop offset="90%" style={{ stopColor: 'hsl(var(--card))' }} />
              <stop offset="100%" style={{ stopColor: 'hsl(var(--card) / 0)' }} />
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_STYLES.cartesianGrid} />
          <XAxis dataKey="date" tickFormatter={formatXAxis} {...CHART_STYLES.xAxis} />
          <YAxis yAxisId="regular" {...CHART_STYLES.yAxis} />
          {useSeparateAxisForTotals && <YAxis orientation="right" yAxisId="total" {...CHART_STYLES.yAxis} />}
          <Tooltip
            cursor={false}
            content={(props) => (
              <ChartTooltip
                active={props.active}
                label={props.label}
                payload={props.payload as Array<{ name: string; value: number; color: string }> | undefined}
                selectedPeriod={selectedPeriod}
                showComparison={showComparisonInTooltip}
              />
            )}
          />
          <Legend
            formatter={(value) => (
              <span className={cn('transition-opacity duration-200', { 'opacity-50': hiddenSeries.includes(value) })}>
                {value} (<MoneyValue amount={totals[value] ?? 0} useColors={false} className="text-xs font-mono" />)
              </span>
            )}
            onClick={handleLegendClick}
          />
          {regularCategories.map((category, index) => (
            <DataComponent
              animationDuration={chartType === 'line' ? 400 : 300}
              animationEasing="ease-out"
              dataKey={category}
              dot={chartType === 'line' ? { r: 3, fill: getColor(category, index), strokeWidth: 0 } : false}
              fill={getColor(category, index)}
              hide={hiddenSeries.includes(category)}
              stackId="a"
              stroke={getColor(category, index)}
              strokeWidth={getStrokeWidth(category)}
              type="monotone"
              yAxisId="regular"
              activeDot={chartType === 'line' ? { r: 6, fill: getColor(category, index), strokeWidth: 2, stroke: 'hsl(var(--card))' } : false}
              className={cn({
                'recharts-line': chartType === 'line',
                'recharts-bar': chartType === 'bar',
              })}
              key={category}
            />
          ))}
          {totalCategories.map((category, index) => (
            <DataComponent
              animationDuration={chartType === 'line' ? 400 : 300}
              animationEasing="ease-out"
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
                      stroke: 'hsl(var(--card))',
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
                'recharts-line': chartType === 'line',
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
