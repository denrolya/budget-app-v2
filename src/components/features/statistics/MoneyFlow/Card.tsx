import { useQuery } from '@tanstack/react-query';
import cn from 'classnames';
import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon, TrendingUpIcon } from 'lucide-react';
import moment from 'moment';
import { FC, useMemo, useState } from 'react';
import { Area, Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { BACKEND_DATE_FORMAT, PERIOD_OPTIONS, PeriodOption, INTERVAL_OPTIONS } from '@/constants/datetime';
import SummaryItem from '@/components/features/statistics/MoneyFlow/SummaryItem';
import CustomTooltip from '@/components/features/statistics/MoneyFlow/Tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { api } from '@/services/api';
import MoneyValue from '@/components/common/MoneyValue';

interface BackendData {
  after: number;
  before: number;
  expense: number;
  income: number;
}

interface TransformedData {
  time: number;
  income: number;
  expenses: number;
  revenue: number;
  date: moment.Moment;
  previousIncome: number;
  previousExpenses: number;
  previousRevenue: number;
}

interface Props {
  className?: string;
}

export const MoneyFlowCard: FC<Props> = ({ className }) => {
  const [period, setPeriod] = useState<PeriodOption['value']>('1M');
  const [interval, setInterval] = useState(INTERVAL_OPTIONS[0].value);
  const [isBarChart, setIsBarChart] = useState(true);

  const selectedPeriodOption = useMemo(() =>
     PERIOD_OPTIONS.find((p) => p.value === period) || PERIOD_OPTIONS[2]
  , [period]);
  const now = useMemo(() => moment(), []);
  const { currentDateRange, previousDateRange } = useMemo(() => {
    const currentRange = selectedPeriodOption.getDateRange(now);
    const duration = moment.duration(currentRange.before.diff(currentRange.after));
    const previousRange = {
      after: currentRange.after.clone().subtract(duration),
      before: currentRange.after.clone().subtract(1, 'second'),
    };
    return { currentDateRange: currentRange, previousDateRange: previousRange };
  }, [selectedPeriodOption, now]);

  const {
    data: currentDataBackend,
    isLoading: isCurrentLoading,
    error: currentError,
  } = useQuery<BackendData[]>({
    queryKey: ['currentData', period, interval],
    queryFn: async () => {
      const response = await api.get('/api/v2/statistics/value-by-period', {
        params: {
          after: currentDateRange.after.format(BACKEND_DATE_FORMAT),
          before: currentDateRange.before.format(BACKEND_DATE_FORMAT),
          interval,
        },
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // Example: data is fresh for 1 hour
  });

  // Fetch previous period data
  const {
    data: previousDataBackend,
    isLoading: isPreviousLoading,
    error: previousError,
  } = useQuery<BackendData[]>({
    queryKey: ['previousData', period, interval],
    queryFn: async () => {
      const response = await api.get('/api/v2/statistics/value-by-period', {
        params: {
          after: previousDateRange.after.format(BACKEND_DATE_FORMAT),
          before: previousDateRange.before.format(BACKEND_DATE_FORMAT),
          interval,
        },
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 240 * 60 * 1000, // Example: data is fresh for 4 hours
  });

  const transformedData: TransformedData[] = useMemo(() => {
    if (!currentDataBackend || !previousDataBackend) return [];

    return currentDataBackend.map((currentItem, index) => {
      const previousItem = previousDataBackend[index] || {
        expense: 0,
        income: 0,
      };

      const revenue = currentItem.income - currentItem.expense;
      const previousRevenue = previousItem.income - previousItem.expense;

      return {
        time: currentItem.after * 1000, // Convert to milliseconds
        income: currentItem.income,
        expenses: currentItem.expense,
        revenue: revenue,
        date: moment.unix(currentItem.after),
        previousIncome: previousItem.income,
        previousExpenses: previousItem.expense,
        previousRevenue: previousRevenue,
      };
    });
  }, [currentDataBackend, previousDataBackend]);

  const {
    change,
    changePercent,
    totalIncome,
    totalExpenses,
    totalRevenue,
    avgDailyIncome,
    avgDailyExpenses,
  } = useMemo(() => {
    const dataLength = transformedData.length;
    const lastData = dataLength > 0 ? transformedData[dataLength - 1] : null;

    const currentRev = lastData ? lastData.revenue : 0;
    const previousRev = lastData ? lastData.previousRevenue : 0;
    const revenueChange = currentRev - previousRev;
    const revenueChangePercent = previousRev !== 0 ? (revenueChange / Math.abs(previousRev)) * 100 : 0;

    const income = transformedData.reduce((sum, d) => sum + d.income, 0);
    const expenses = transformedData.reduce((sum, d) => sum + d.expenses, 0);
    const revenue = transformedData.reduce((sum, d) => sum + d.revenue, 0);
    const avgIncome = dataLength > 0 ? income / dataLength : 0;
    const avgExpenses = dataLength > 0 ? expenses / dataLength : 0;

    return {
      currentRevenue: currentRev,
      previousRevenueValue: previousRev,
      change: revenueChange,
      changePercent: revenueChangePercent,
      totalIncome: income,
      totalExpenses: expenses,
      totalRevenue: revenue,
      avgDailyIncome: avgIncome,
      avgDailyExpenses: avgExpenses,
    };
  }, [transformedData]);

  return (
    <Card className={cn('w-full max-w-3xl', className)}>
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-normal">Money Flow</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h2 className="text-4xl font-bold">
            <MoneyValue showSign amount={totalRevenue} />
          </h2>
          <div
            className={cn('flex items-center text-sm', {
              'text-primary': change >= 0,
              'text-destructive': change < 0,
            })}
          >
            <span className="mr-2">
              <MoneyValue amount={change} />
              {' '}
              ({changePercent.toFixed(0)}%)
            </span>
            {change >= 0 ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
            <span className="ml-2">vs. previous {period}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-2">
            {PERIOD_OPTIONS.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'outline'}
                onClick={() => setPeriod(p.value)}
                className="text-xs px-2 py-1 h-auto"
              >
                {p.label}
              </Button>
            ))}
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue placeholder="Interval" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="chart-type"
              checked={isBarChart}
              onCheckedChange={setIsBarChart}
            />
            <Label htmlFor="chart-type" className="text-xs">
              {isBarChart ? 'Bar Chart' : 'Line Chart'}
            </Label>
          </div>
        </div>
        <div className="h-[300px] mb-4">
          {(isCurrentLoading || isPreviousLoading) && <div>Loading...</div>}

          {(currentError || previousError) && (
            <div>
              {currentError && <p>Error loading current data: {currentError.message}</p>}
              {previousError && <p>Error loading previous data: {previousError.message}</p>}
            </div>
          )}

          {!isCurrentLoading && !isPreviousLoading && !currentError && !previousError && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={transformedData}>
                <XAxis
                  dataKey="time"
                  scale="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(unixTime) => moment(unixTime).format('MM/DD')}
                  hide
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip transformedData={transformedData} />} />
                {isBarChart ? (
                  <>
                    <Bar dataKey="income" fill="hsl(var(--primary))" />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" />
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
                    />
                  </>
                )}
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
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
          <SummaryItem value={totalIncome} icon={DollarSignIcon} label="Total Income" />
          <SummaryItem value={totalExpenses} icon={DollarSignIcon} label="Total Expenses" />
          <SummaryItem value={totalRevenue} icon={TrendingUpIcon} label="Net Revenue" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <SummaryItem value={avgDailyIncome} icon={DollarSignIcon} label="Avg. Daily Income" />
          <SummaryItem value={avgDailyExpenses} icon={DollarSignIcon} label="Avg. Daily Expenses" />
        </div>
      </CardContent>
    </Card>
  );
};

export default MoneyFlowCard;
