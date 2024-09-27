import moment from 'moment/moment';
import React, { useState } from 'react';
import { Area, Bar, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import CustomTooltip from '@/components/features/statistics/MoneyFlow/Tooltip.tsx';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
  isBarChart: boolean;
}

const MoneyFlowChart: React.FC<Props> = ({ data, isBarChart }) => {
  const [showRevenue, setShowRevenue] = useState(false);

  const transformedData = data.map(item => ({
    ...item,
    expenses: -item.expenses,
  }));

  const maxValue = Math.max(...data.map(item => Math.max(item.income, item.expenses, item.revenue, item.previousRevenue)));

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="show-revenue"
          checked={showRevenue}
          onCheckedChange={setShowRevenue}
        />
        <Label htmlFor="show-revenue">
          {showRevenue ? 'Show Income/Expenses' : 'Show Revenue'}
        </Label>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart stackOffset="sign" data={transformedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.2)" />
              <stop offset="50%" stopColor="hsl(var(--primary) / 0.6)" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" />
              <stop offset="50%" stopColor="hsl(var(--destructive) / 0.6)" />
              <stop offset="100%" stopColor="hsl(var(--destructive) / 0.2)" />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" scale="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(unixTime: number) => moment(unixTime).format('MM/DD')} hide />
          <YAxis hide domain={[-maxValue, maxValue]} />
          <Tooltip cursor={false} content={<CustomTooltip data={data} />} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
          {showRevenue ? (
            <>
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="previousRevenue"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </>
          ) : (
            isBarChart ? (
              <>
                <Bar
                  dataKey="expenses"
                  fill="hsl(var(--destructive))"
                  stackId="stack"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                >
                  {transformedData.map((entry, index) => (
                    <rect key={`expenses-${index}`} fill="url(#expensesGradient)" />
                  ))}
                </Bar>
                <Bar
                  dataKey="income"
                  fill="hsl(var(--primary))"
                  stackId="stack"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                >
                  {transformedData.map((entry, index) => (
                    <rect key={`income-${index}`} fill="url(#incomeGradient)" />
                  ))}
                </Bar>
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="income"
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  fill="hsl(var(--destructive))"
                  stroke="hsl(var(--destructive))"
                  fillOpacity={0.3}
                  baseValue={0}
                />
              </>
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoneyFlowChart;
