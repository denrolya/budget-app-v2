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

import CustomTooltip from '@/components/features/statistics/MoneyFlow/Tooltip';
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
                                         }) => {
  const transformedData = data.map(item => ({
    ...item,
    expenses: -item.expenses,
    previousExpenses: -item.previousExpenses,
  }));

  const maxValue = Math.max(
    ...data.flatMap(item => [
      item.income,
      item.expenses,
      item.revenue,
      showPreviousPeriod ? item.previousIncome : 0,
      showPreviousPeriod ? item.previousExpenses : 0,
      showPreviousPeriod ? item.previousRevenue : 0,
    ]),
  );

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
                  type="monotone"
                  xAxisId={xAxisId}
                  dataKey={dataKeys.income}
                  stroke={'hsl(var(--success))'}
                  strokeWidth={isCurrentTimeframe ? 3 : 2}
                  strokeOpacity={isCurrentTimeframe ? 1 : 0.7}
                  dot={false}
                  strokeDasharray={isCurrentTimeframe ? undefined : '5 5'}
                  className="recharts-line fade-line"
                />
              )}
              {showExpenses && (
                <Line
                  type="monotone"
                  xAxisId={xAxisId}
                  dataKey={dataKeys.expenses}
                  stroke={'hsl(var(--destructive))'}
                  strokeWidth={isCurrentTimeframe ? 3 : 2}
                  strokeOpacity={isCurrentTimeframe ? 1 : 0.7}
                  dot={false}
                  strokeDasharray={isCurrentTimeframe ? undefined : '5 5'}
                  className="recharts-line fade-line"
                />
              )}
              {showRevenue && (
                <Line
                  type="monotone"
                  xAxisId={xAxisId}
                  dataKey={dataKeys.revenue}
                  stroke={'hsl(var(--secondary))'}
                  strokeWidth={isCurrentTimeframe ? 3 : 2}
                  strokeOpacity={isCurrentTimeframe ? 1 : 0.7}
                  dot={false}
                  strokeDasharray={isCurrentTimeframe ? undefined : '5 5'}
                  className="recharts-line fade-line"
                />
              )}
            </>
          )}
        </>
      );
    }
    return null;
  };

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
        <ComposedChart
          stackOffset="sign"
          data={transformedData}
          margin={{ top: 0, right: 30, bottom: 0, left: -30 }}
        >
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success) / 0.7)" />
              <stop offset="100%" stopColor="hsl(var(--success))" />
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" />
              <stop offset="100%" stopColor="hsl(var(--destructive) / 0.7)" />
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--secondary) / 0.7)" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
            <linearGradient id="incomeGradientPrevious" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--success) / 0.1)" />
              <stop offset="100%" stopColor="hsl(var(--success) / 0.2)" />
            </linearGradient>
            <linearGradient id="expensesGradientPrevious" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive) / 0.2)" />
              <stop offset="100%" stopColor="hsl(var(--destructive) / 0.1)" />
            </linearGradient>
            <linearGradient id="revenueGradientPrevious" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--secondary) / 0.1)" />
              <stop offset="100%" stopColor="hsl(var(--secondary) / 0.2)" />
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
          <XAxis
            hide
            xAxisId={0}
            dataKey="timestamp"
            scale="time"
            type="number"
            {...CHART_STYLES.xAxis}
          />
          <YAxis
            domain={[-maxValue, maxValue]}
            {...CHART_STYLES.yAxis}
          />
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
          <ReferenceLine {...CHART_STYLES.referenceLine} />
          {renderChart(false)}
          {renderChart(true)}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoneyFlowChart;
