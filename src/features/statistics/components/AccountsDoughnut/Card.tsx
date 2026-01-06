import { ResponsivePie } from '@nivo/pie';
import find from 'lodash/find';
import sortBy from 'lodash/sortBy';
import { Calendar as CalendarIcon } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { MoneyValue } from '@/components/common/MoneyValue';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { CURRENCIES } from '@/constants/currency';
import { useAccountDistribution } from '@/hooks/statistics/useAccountDistributionStatistics';
import { UseTimeframeControl, useTimeframeControl } from '@/hooks/useTimeframeControl';
import { Timeframe } from '@/types/global';
import { Type, Type as TransactionType } from '@/types/transaction';
import { formatShortDate } from '@/lib/datetime/formatShortDate';
import Skeleton from '@/features/statistics/components/CategoriesDoughnut/Skeleton';
import ConfigurationMenu from '@/features/statistics/components/CategoriesDoughnut/ConfigurationMenu';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  controlledTimeframe?: UseTimeframeControl;
}

type ViewMode = 'accounts' | 'currencies';

interface DistributionItem {
  id: string;
  name: string;
  value: number;
  amount?: number;
  currency?: string | null;
}

const AccountsDoughnutCard: React.FC<Props> = ({ controlledTimeframe, className }) => {
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.Expense);
  const [showMonthlyAverage, setShowMonthlyAverage] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('accounts');
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

  const fallbackTimeframe = useTimeframeControl({
    defaultTimeframe: {
      after: moment().startOf('month'),
      before: moment().endOf('month'),
    },
    enablePreviousTimeframe: false,
    enablePeriod: false,
  });

  const {
    timeframe = fallbackTimeframe.timeframe,
    setTimeframe = fallbackTimeframe.setTimeframe,
  } = controlledTimeframe ?? {};

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: range.after ? moment(range.after).startOf('day') : timeframe.after,
        before: range.before ? moment(range.before).endOf('day') : timeframe.before,
      });
    },
    [setTimeframe, timeframe],
  );

  const { stats: accountStats, total: totalAmount, isLoading } = useAccountDistribution(
    { type: transactionType, after: timeframe.after, before: timeframe.before },
    [],
  );

  const calcMonthlyAverage = useCallback(
    (value: number) => {
      const now = moment();
      const { after, before } = timeframe;
      const months = moment(before).isAfter(now)
        ? now.diff(moment(after), 'months')
        : moment(before).diff(moment(after), 'months');
      return months > 0 ? value / months : value;
    },
    [timeframe],
  );

  const currencyAggregates = useMemo(() => {
    type Agg = { value: number; amount: number };
    const sums = accountStats.reduce<Map<string, Agg>>((map, stat) => {
      const code = stat.account.currency ?? '—';
      const prev = map.get(code) ?? { value: 0, amount: 0 };
      map.set(code, {
        value: prev.value + (stat.value ?? 0),
        amount: prev.amount + (stat.amount ?? 0),
      });
      return map;
    }, new Map());

    const list = Array.from(sums.entries())
      .filter(([, v]) => v.value > 0)
      .map(([code, agg]) => ({
        code,
        label: CURRENCIES[code as keyof typeof CURRENCIES]?.name ?? code,
        symbol: CURRENCIES[code as keyof typeof CURRENCIES]?.symbol,
        value: agg.value,
        amount: agg.amount,
      }));

    return sortBy(list, 'value');
  }, [accountStats]);

  const accountItems: DistributionItem[] = useMemo(() => {
    const filtered = selectedCurrency
      ? accountStats.filter((s) => (s.account.currency ?? '—') === selectedCurrency)
      : accountStats;

    return sortBy(
      filtered.map<DistributionItem>((s) => ({
        id: String(s.account.id),
        name: s.account.displayName ?? s.account.name,
        value: s.value,
        amount: s.amount,
        currency: s.account.currency,
      })),
      'value',
    );
  }, [accountStats, selectedCurrency]);

  const currentScope = useMemo(() => {
    if (viewMode === 'currencies' && !selectedCurrency) {
      const items: DistributionItem[] = currencyAggregates.map((c) => ({
        id: c.code,
        name: c.symbol ? `${c.symbol} ${c.code}` : c.code,
        value: c.value,
        amount: c.amount,
        currency: c.code,
      }));
      const total = currencyAggregates.reduce((sum, c) => sum + c.value, 0);
      return { items, total, label: 'All Currencies' as const };
    }

    if (viewMode === 'currencies' && selectedCurrency) {
      const total = accountItems.reduce((sum, i) => sum + i.value, 0);
      return { items: accountItems, total, label: selectedCurrency as const };
    }

    return { items: accountItems, total: totalAmount, label: 'All Accounts' as const };
  }, [viewMode, selectedCurrency, currencyAggregates, accountItems, totalAmount]);

  const displayItems: DistributionItem[] = useMemo(
    () =>
      showMonthlyAverage
        ? currentScope.items.map((i) => ({
          ...i,
          value: calcMonthlyAverage(i.value),
          amount: typeof i.amount === 'number' ? calcMonthlyAverage(i.amount) : i.amount,
        }))
        : currentScope.items,
    [currentScope.items, showMonthlyAverage, calcMonthlyAverage],
  );

  const chartData = useMemo(
    () =>
      displayItems.map((i) => ({
        id: i.id,
        label: i.name,
        value: i.value,
      })),
    [displayItems],
  );

  const displayedTotal = useMemo(
    () => (showMonthlyAverage ? calcMonthlyAverage(currentScope.total) : currentScope.total),
    [showMonthlyAverage, currentScope, calcMonthlyAverage],
  );

  const handleSliceClick = useCallback(
    (node: { data: { id: string | number } }) => {
      if (viewMode === 'currencies' && !selectedCurrency) {
        setSelectedCurrency(String(node.data.id));
      }
    },
    [viewMode, selectedCurrency],
  );

  const renderNativeLine = (amount?: number, code?: string | null) => {
    if (typeof amount !== 'number' || !code) return null;
    const symbol = CURRENCIES[code as keyof typeof CURRENCIES]?.symbol;
    return (
      <span className="text-2xs text-muted-foreground">
        {symbol ? `${symbol} ${amount.toLocaleString()}` : `${amount.toLocaleString()} ${code}`}
      </span>
    );
  };

  return (
    <Card className={`flex flex-col h-full w-full transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 ${className}`}>
      <CardHeader className="p-4 pb-0 space-y-0.5">
        <div className="flex justify-between items-start">
          <CardTitle className="tracking-tight text-lg font-bold mb-2">
            {transactionType === TransactionType.Expense ? 'Expenses' : 'Income'}{' '}
            {viewMode === 'currencies' ? 'by Currency' : 'by Account'}
          </CardTitle>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Currency mode</span>
              <Switch
                aria-label="Toggle currency mode"
                checked={viewMode === 'currencies'}
                onCheckedChange={(checked) => {
                  setViewMode(checked ? 'currencies' : 'accounts');
                  setSelectedCurrency(null);
                }}
              />
            </div>

            <ConfigurationMenu
              setShowMonthlyAverage={setShowMonthlyAverage}
              setType={setTransactionType}
              showMonthlyAverage={showMonthlyAverage}
              timeframe={timeframe}
              type={transactionType}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
        {!controlledTimeframe?.timeframe?.after && (
          <DaterangePickerWithPresets
            after={timeframe.after}
            before={timeframe.before}
            onChange={handleTimeframeChange}>
            <span className="cursor-pointer hover:underline inline-flex flex-row mb-2">
              <span className="text-xs flex items-center">
                <CalendarIcon className="inline h-3 w-3 mr-1" />
                {formatShortDate(timeframe.after)} – {formatShortDate(timeframe.before)}
              </span>
            </span>
          </DaterangePickerWithPresets>
        )}

        {isLoading && <Skeleton />}

        {!isLoading && displayItems.length > 0 && (
          <div className="flex flex-col h-full">
            <div className="w-full h-64 md:h-96">
              <ResponsivePie
                sortByValue
                activeOuterRadiusOffset={8}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                borderWidth={1}
                colors={{ scheme: transactionType === Type.Expense ? 'reds' : 'greens' }}
                cornerRadius={3}
                data={chartData}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                innerRadius={0.6}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                padAngle={0.7}
                valueFormat={(v) => v.toLocaleString()}
                tooltip={({ datum: { data, value } }) => {
                  const item = find(displayItems, (i) => String(i.id) === String((data as any).id));
                  return (
                    <div className="bg-popover text-popover-foreground p-2 rounded shadow-md">
                      <strong>{(data as any).label}</strong>
                      <div>
                        <MoneyValue amount={value as number} useColors={false} />
                        <span className="ml-1 text-xs text-muted-foreground">
                          {currentScope.total > 0 ? (((value as number) / currentScope.total) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      {item && renderNativeLine(item.amount, item.currency)}
                    </div>
                  );
                }}
                onClick={handleSliceClick}
              />
            </div>

            <ScrollArea className="h-64 md:h-96 mt-4">
              <div className="space-y-1 min-w-full">
                {[...displayItems].reverse().map((item) => (
                  <div
                    className="flex items-center justify-between text-sm p-1 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                    key={item.id}
                    onClick={() => {
                      if (viewMode === 'currencies' && !selectedCurrency) {
                        setSelectedCurrency(String(item.id));
                      }
                    }}
                  >
                    <ResponsiveTooltip
                      openDelay={1}
                      content={
                        <>
                          <code className="font-mono text-xs">#{String(item.id)}</code>: <span>{item.name}</span>
                        </>
                      }
                      triggerClassName="truncate flex-1"
                    >
                      <span className="truncate flex-1">
                        {item.name}
                        {item.value > 0 && (
                          <small className="ml-1 text-xs text-muted-foreground">
                            ({currentScope.total > 0 ? ((item.value / currentScope.total) * 100).toFixed(0) : 0}%)
                          </small>
                        )}
                      </span>
                    </ResponsiveTooltip>

                    <div className="flex flex-col items-end gap-0.5">
                      <MoneyValue amount={item.value} useColors={false} />
                      {renderNativeLine(item.amount, item.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t">
        <div className="w-full flex items-center justify-between min-h-[48px]">
          <span className="text-sm font-medium">Total</span>
          <MoneyValue amount={displayedTotal} useColors={false} className="text-lg font-semibold" />
        </div>
      </CardFooter>
    </Card>
  );
};

export default AccountsDoughnutCard;
