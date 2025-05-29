import moment, { Moment } from 'moment';
import React from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import CustomTooltip from '@/components/features/statistics/MoneyFlow/ChartTooltip';
import { MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import { CHART_STYLES } from '@/constants/recharts';
import { ISO8601Period } from '@/types/global';

interface Props {
  data: {
    timestamp: number;
    income: number;
    expenses: number;
    revenue: number;
    date: Moment;
    previousIncome: number;
    previousExpenses: number;
    previousRevenue: number;
  }[];
  period: ISO8601Period;
  currentTimeframe: { after: Moment; before: Moment };
  previousTimeframe: { after: Moment; before: Moment };
  chartType: 'bar' | 'line';
  showIncome: boolean;
  showExpenses: boolean;
  showRevenue: boolean;
  showPreviousPeriod: boolean;
  showYearBoundary: boolean;
  showMonthBoundary: boolean;
  showSeasonBoundary: boolean;
}

const MoneyFlowChart: React.FC<Props> = ({
                                           currentTimeframe,
                                           previousTimeframe,
                                           period,
                                           data,
                                           chartType,
                                           showIncome,
                                           showExpenses,
                                           showRevenue,
                                           showPreviousPeriod,
                                           showYearBoundary,
                                           showMonthBoundary,
                                           showSeasonBoundary,
                                         }) => {
  const transformedData = data.map((item) => ({
    ...item,
    expenses: -item.expenses,
    previousExpenses: -item.previousExpenses,
  }));

  const renderChart = (isCurrentTimeframe: boolean) => {
    if (isCurrentTimeframe || showPreviousPeriod) {
      const xAxisId = isCurrentTimeframe ? 1 : 0;
      const dataKeys = {
        income: isCurrentTimeframe ? 'income' : 'previousIncome',
        expenses: isCurrentTimeframe ? 'expenses' : 'previousExpenses',
        revenue: isCurrentTimeframe ? 'revenue' : 'previousRevenue',
      };

      return (
        <>
          {chartType === 'bar' ? (
            <>
              {showExpenses && (
                <Bar
                  dataKey={dataKeys.expenses}
                  xAxisId={xAxisId}
                  fill={`url(#expensesGradient${isCurrentTimeframe ? '' : 'Previous'})`}
                  stackId={isCurrentTimeframe ? 'currentStack' : 'previousStack'}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                  className="recharts-bar"
                />
              )}
              {showIncome && (
                <Bar
                  dataKey={dataKeys.income}
                  xAxisId={xAxisId}
                  fill={`url(#incomeGradient${isCurrentTimeframe ? '' : 'Previous'})`}
                  stackId={isCurrentTimeframe ? 'currentStack' : 'previousStack'}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                  className="recharts-bar"
                />
              )}
              {showRevenue && (
                <Bar
                  dataKey={dataKeys.revenue}
                  xAxisId={xAxisId}
                  fill={`url(#revenueGradient${isCurrentTimeframe ? '' : 'Previous'})`}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                  className="recharts-bar"
                />
              )}
            </>
          ) : (
            <>
              {showIncome && (
                <Line
                  type="bump"
                  xAxisId={xAxisId}
                  dataKey={dataKeys.income}
                  stroke={'hsl(var(--success))'}
                  strokeWidth={isCurrentTimeframe ? 3 : 1}
                  strokeOpacity={isCurrentTimeframe ? 1 : 0.3}
                  dot={false}
                  strokeDasharray={isCurrentTimeframe ? undefined : '15 8'}
                />
              )}
              {showExpenses && (
                <Line
                  type="bump"
                  xAxisId={xAxisId}
                  dataKey={dataKeys.expenses}
                  stroke={'hsl(var(--destructive))'}
                  strokeWidth={isCurrentTimeframe ? 3 : 1}
                  strokeOpacity={isCurrentTimeframe ? 1 : 0.3}
                  dot={false}
                  strokeDasharray={isCurrentTimeframe ? undefined : '15 8'}
                />
              )}
              {showRevenue && (
                <Line
                  type="bump"
                  xAxisId={xAxisId}
                  dataKey={dataKeys.revenue}
                  stroke={'hsl(var(--secondary))'}
                  strokeWidth={isCurrentTimeframe ? 3 : 1}
                  strokeOpacity={isCurrentTimeframe ? 1 : 0.45}
                  dot={false}
                  strokeDasharray={isCurrentTimeframe ? undefined : '15 8'}
                />
              )}
            </>
          )}
        </>
      );
    }
    return null;
  };

  const findClosestTimestamp = (timestamps: number[], target: number): number => timestamps.reduce((prev, curr) =>
      Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev,
    );

  const generateNonOverlappingBoundaries = (
    dataTimestamps: number[],
    start: Moment,
    end: Moment,
    period: ISO8601Period,
    enabled: Record<'year' | 'month' | 'season', boolean>,
  ) => {
    const taken = new Set<number>();
    const yearBoundaries: number[] = [];
    const seasonBoundaries: number[] = [];
    const monthBoundaries: number[] = [];

    const snapTimestamp = (cursor: Moment) => {
      const target = cursor.unix();
      return findClosestTimestamp(dataTimestamps, target);
    };

    if (enabled.year) {
      const cursor = moment(start).startOf('year').add(1, 'year');
      while (cursor.isBefore(end)) {
        const ts = snapTimestamp(cursor);
        if (!taken.has(ts)) {
          yearBoundaries.push(ts);
          taken.add(ts);
        }
        cursor.add(1, 'year');
      }
    }

    if (enabled.season) {
      const cursor = moment(start).startOf('month').add(1, 'month');
      while (cursor.isBefore(end)) {
        if ([0, 2, 5, 8].includes(cursor.month())) {
          const ts = snapTimestamp(cursor);
          if (!taken.has(ts)) {
            seasonBoundaries.push(ts);
            taken.add(ts);
          }
        }
        cursor.add(1, 'month');
      }
    }

    if (enabled.month && period !== 'P1M') {
      const cursor = moment(start).startOf('month').add(1, 'month');
      while (cursor.isBefore(end)) {
        const ts = snapTimestamp(cursor);
        if (!taken.has(ts)) {
          monthBoundaries.push(ts);
          taken.add(ts);
        }
        cursor.add(1, 'month');
      }
    }

    return { yearBoundaries, seasonBoundaries, monthBoundaries };
  };

  const { yearBoundaries, seasonBoundaries, monthBoundaries } = generateNonOverlappingBoundaries(
    transformedData.map((item) => item.timestamp),
    currentTimeframe.after,
    currentTimeframe.before,
    period,
    { year: showYearBoundary, season: showSeasonBoundary, month: showMonthBoundary },
  );

  const formatXAxisTick = (timestamp: number) => {
    const date = moment.unix(timestamp);
    let label = '';

    switch (period) {
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

  return (
    <div className="w-full h-full min-w-[600px]">
      <ResponsiveContainer width="100%" height={385}>
        <ComposedChart stackOffset="sign" data={transformedData} margin={{ top: 0, right: 30, bottom: 0, left: -30 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success) / 0.7)" />
              <stop offset="100%" stopColor="hsl(var(--success) / 0.5)" />
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--destructive) / 0.7)" />
              <stop offset="100%" stopColor="hsl(var(--destructive) / 0.5)" />
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--secondary) / 0.7)" />
              <stop offset="100%" stopColor="hsl(var(--secondary) / 0.5)" />
            </linearGradient>
            <linearGradient id="incomeGradientPrevious" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--success) / 0.2)" />
              <stop offset="100%" stopColor="hsl(var(--success) / 0.1)" />
            </linearGradient>
            <linearGradient id="expensesGradientPrevious" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive) / 0.2)" />
              <stop offset="100%" stopColor="hsl(var(--destructive) / 0.1)" />
            </linearGradient>
            <linearGradient id="revenueGradientPrevious" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--secondary) / 0.2)" />
              <stop offset="100%" stopColor="hsl(var(--secondary) / 0.1)" />
            </linearGradient>
          </defs>
          <XAxis
            xAxisId={1}
            dataKey="timestamp"
            scale="time"
            type="number"
            tickFormatter={formatXAxisTick}
            {...CHART_STYLES.xAxis}
          />
          <XAxis hide xAxisId={0} dataKey="timestamp" scale="time" type="number" {...CHART_STYLES.xAxis} />
          <YAxis {...CHART_STYLES.yAxis} />
          <Tooltip
            cursor={false}
            content={(props) => (
              <CustomTooltip
                {...props}
                data={data}
                period={period}
                currentTimeframe={currentTimeframe}
                previousTimeframe={previousTimeframe}
              />
            )}
          />
          <CartesianGrid {...CHART_STYLES.cartesianGrid} />
          {yearBoundaries.map((timestamp) => (
            <ReferenceLine
              key={`year-${timestamp}`}
              x={timestamp}
              stroke="hsl(var(--destructive))"
              strokeDasharray="14 14"
              label={{
                position: 'bottom',
                value: moment.unix(timestamp).format('YYYY'),
                fill: 'hsl(var(--destructive))',
                fontSize: 12,
                fontWeight: 500,
              }}
            />
          ))}

          {seasonBoundaries.map((timestamp) => (
            <ReferenceLine
              key={`season-${timestamp}`}
              x={timestamp}
              stroke="hsl(var(--warning) / 0.9)"
              strokeDasharray="10 10"
              label={{
                position: 'bottom',
                value: ['Spring', 'Summer', 'Autumn', 'Winter'][Math.floor(moment.unix(timestamp).month() / 3)],
                fill: 'hsl(var(--warning) / 0.9)',
                fontSize: 10,
                fontWeight: 400,
              }}
            />
          ))}

          {monthBoundaries.map((timestamp) => (
            <ReferenceLine
              key={`month-${timestamp}`}
              x={timestamp}
              stroke="hsl(var(--info) / 0.7)"
              strokeDasharray="6 6"
              label={{
                position: 'bottom',
                value: moment.unix(timestamp).format('MMM'),
                fill: 'hsl(var(--info) / 0.7)',
                fontSize: 10,
                fontWeight: 400,
              }}
            />
          ))}
          <ReferenceLine {...CHART_STYLES.referenceLine} />
          {renderChart(false)}
          {renderChart(true)}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoneyFlowChart;
