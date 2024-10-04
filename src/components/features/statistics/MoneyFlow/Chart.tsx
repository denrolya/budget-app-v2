import CustomTooltip from '@/components/features/statistics/MoneyFlow/Tooltip';
import moment from 'moment/moment';
import React from 'react';
import { Bar, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
  data: {
    time: number;
    income: number;
    expenses: number;
    revenue: number;
    date: moment.Moment;
    previousIncome: number;
    previousExpenses: number;
    previousRevenue: number;
  }[];
  interval: string;
  currentTimeframe: { after: moment.Moment; before: moment.Moment };
  previousTimeframe: { after: moment.Moment; before: moment.Moment };
  isBarChart: boolean;
  showRevenue: boolean;
}

const MoneyFlowChart: React.FC<Props> = ({
                                           currentTimeframe,
                                           previousTimeframe,
                                           interval,
                                           data,
                                           isBarChart,
                                           showRevenue,
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
      item.previousIncome,
      item.previousExpenses,
      item.previousRevenue,
    ]),
  );

  return (
    <div className="min-w-[600px]">
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart stackOffset="sign" data={transformedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--success) / 0.2)" />
              <stop offset="50%" stopColor="hsl(var(--success) / 0.6)" />
              <stop offset="100%" stopColor="hsl(var(--success))" />
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" />
              <stop offset="50%" stopColor="hsl(var(--destructive) / 0.6)" />
              <stop offset="100%" stopColor="hsl(var(--destructive) / 0.2)" />
            </linearGradient>
            <linearGradient id="previousIncomeGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--success) / 0.1)" />
              <stop offset="100%" stopColor="hsl(var(--success) / 0.3)" />
            </linearGradient>
            <linearGradient id="previousExpensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive) / 0.3)" />
              <stop offset="100%" stopColor="hsl(var(--destructive) / 0.1)" />
            </linearGradient>
          </defs>
          <XAxis
            hide
            xAxisId={1}
            dataKey="time"
            scale="time"
            type="number"
            domain={['dataMin', 'dataMax']}
          />
          <XAxis
            hide
            xAxisId={0}
            dataKey="time"
            scale="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            fillOpacity={0.2}
          />
          <YAxis hide domain={[-maxValue, maxValue]} />
          <Tooltip
            cursor={false}
            content={(props) => (
              <CustomTooltip
                {...props}
                data={data}
                interval={interval}
                currentTimeframe={currentTimeframe}
                previousTimeframe={previousTimeframe} />)} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
          {showRevenue && (
            <>
              <Line
                type="monotone"
                xAxisId={1}
                dataKey="revenue"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                xAxisId={1}
                dataKey="previousRevenue"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </>
          )}
          {isBarChart && (
            <>
              {/* Previous timeframe bars */}
              <Bar
                dataKey="previousIncome"
                xAxisId={0}
                fill="hsl(var(--success))"
                stackId="previousStack"
                fillOpacity={0.1}
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
              <Bar
                dataKey="previousExpenses"
                xAxisId={0}
                fill="hsl(var(--destructive))"
                stackId="previousStack"
                fillOpacity={0.1}
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
              {/* Current timeframe bars */}
              <Bar
                dataKey="expenses"
                xAxisId={1}
                fill="hsl(var(--destructive))"
                stackId="currentStack"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
              <Bar
                dataKey="income"
                xAxisId={1}
                fill="hsl(var(--success))"
                stackId="currentStack"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </>
          )}
          {!isBarChart && (
            <>
              <Line
                type="monotone"
                xAxisId={1}
                dataKey="income"
                stroke="hsl(var(--success))"
                dot={false}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                xAxisId={1}
                dataKey="expenses"
                stroke="hsl(var(--destructive))"
                dot={false}
                animationDuration={1000}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoneyFlowChart;
