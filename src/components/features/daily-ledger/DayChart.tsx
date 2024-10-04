
import moment from 'moment';
import React, { useMemo } from 'react';
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import Transaction, { Type } from '@/models/Transaction';
import MoneyValue from '@/components/common/MoneyValue.tsx';

interface DayChartProps {
  transactions: Transaction[];
  baseCurrency: string;
  date: moment.Moment;
}

const DayChart: React.FC<DayChartProps> = ({ transactions, baseCurrency, date }) => {
  const chartData = useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      expenses: 0,
      incomes: 0,
    }));

    transactions.forEach((transaction) => {
      if (transaction.executedAt.isSame(date, 'day')) {
        const hour = transaction.executedAt.hour();
        const amount = transaction.convertedValues[baseCurrency];

        if (transaction.type === Type.Expense) {
          hourlyData[hour].expenses -= amount; // Make expenses negative
        } else {
          hourlyData[hour].incomes += amount;
        }
      }
    });

    return hourlyData;
  }, [transactions, baseCurrency, date]);

  const maxValue = Math.max(
    ...chartData.flatMap(item => [Math.abs(item.incomes), Math.abs(item.expenses)]),
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomes = payload[0].value;
      const expenses = -payload[1].value; // Convert back to positive for display
      const revenue = incomes - expenses;
      return (
        <div className="bg-popover text-popover-foreground p-2 rounded shadow-md">
          <p className="font-bold">{`${label}:00 - ${(label + 1) % 24}:00`}</p>
          <p className="text-success">Income: <MoneyValue className="font-mono" amount={incomes} /></p>
          <p className="text-destructive">Expenses: <MoneyValue className="font-mono" amount={-expenses} /></p>
          <p className="font-bold">Revenue: <MoneyValue className="font-mono" amount={revenue} /></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col h-[200px] mb-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          stackOffset="sign"
        >
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
          </defs>
          <XAxis
            dataKey="hour"
            axisLine={false}
            tickLine={false}
            ticks={[0, 6, 12, 18]}
            tickFormatter={(value) => `${value}`}
            stroke="hsl(var(--muted-foreground))"
            opacity={0.5}
          />
          <YAxis
            hide
            domain={[-maxValue, maxValue]}
          />
          <Tooltip cursor={false} content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
          <Bar
            dataKey="incomes"
            fill="hsl(var(--success))"
            stackId="stack"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Bar
            dataKey="expenses"
            fill="hsl(var(--destructive))"
            stackId="stack"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DayChart;
