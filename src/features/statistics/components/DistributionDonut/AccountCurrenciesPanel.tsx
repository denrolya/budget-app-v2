import { PieSvgProps } from '@nivo/pie';
import sortBy from 'lodash/sortBy';
import moment from 'moment';
import React, { useCallback, useMemo } from 'react';

import { CURRENCIES } from '@/constants/currency';

import CardSkeleton from './CardSkeleton';
import Chart from './Chart';
import { CURRENCY_COLORS, DEFAULT_COLOR } from './constants';
import DistributionTable from './DistributionTable';
import DonutTooltip from './DonutTooltip';
import type { Datum, Item, TabKey } from './types';
import { renderNativeLine } from './utils';


interface Props {
  tab: TabKey;
  timeframe: { after: moment.Moment; before: moment.Moment };
  showMonthlyAverage: boolean;

  selectedCurrency: string | null;
  onCurrencySelect: (id: string) => void;

  accountStats: any[];
  totalAccountsRaw: number;

  isLoading: boolean;
}

const AccountsCurrenciesPanel: React.FC<Props> = ({
                                                    tab,
                                                    timeframe,
                                                    showMonthlyAverage,
                                                    selectedCurrency,
                                                    onCurrencySelect,
                                                    accountStats,
                                                    totalAccountsRaw,
                                                    isLoading,
                                                  }) => {
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

  const applyMonthly = useCallback(
    (v: number) => (showMonthlyAverage ? calcMonthlyAverage(v) : v),
    [showMonthlyAverage, calcMonthlyAverage],
  );

  const accountItemsAll: Item[] = useMemo(() => {
    const items = accountStats.map((s) => ({
      id: String(s.account.id),
      name: s.account.displayName ?? s.account.name,
      value: applyMonthly(s.value ?? 0),
      amount: applyMonthly(s.amount ?? 0),
      currency: s.account.currency,
      color: (s.account as any).color ?? null,
    }));
    return sortBy(items, 'value');
  }, [accountStats, applyMonthly]);

  const currencyItemsAll: Item[] = useMemo(() => {
    type Agg = { value: number; amount: number };
    const sums = new Map<string, Agg>();

    for (const stat of accountStats) {
      const code = stat.account.currency ?? '—';
      const prev = sums.get(code) ?? { value: 0, amount: 0 };
      sums.set(code, {
        value: prev.value + (stat.value ?? 0),
        amount: prev.amount + (stat.amount ?? 0),
      });
    }

    const list: Item[] = Array.from(sums.entries())
      .filter(([, v]) => v.value > 0)
      .map(([code, agg]) => {
        const symbol = CURRENCIES[code as keyof typeof CURRENCIES]?.symbol;
        return {
          id: code,
          name: symbol ? `${symbol} ${code}` : code,
          value: applyMonthly(agg.value),
          amount: applyMonthly(agg.amount),
          currency: code,
        };
      });

    return sortBy(list, 'value');
  }, [accountStats, applyMonthly]);

  const totalAccounts = useMemo(() => applyMonthly(totalAccountsRaw ?? 0), [applyMonthly, totalAccountsRaw]);

  const currencyTotal = useMemo(() => {
    if (!selectedCurrency) return 0;
    return accountItemsAll
      .filter((i) => (i.currency ?? '—') === selectedCurrency)
      .reduce((sum, i) => sum + i.value, 0);
  }, [accountItemsAll, selectedCurrency]);

  const currencyAccounts = useMemo(() => {
    if (!selectedCurrency) return [];
    return accountItemsAll.filter((i) => (i.currency ?? '—') === selectedCurrency);
  }, [accountItemsAll, selectedCurrency]);

  const currenciesGrandTotal = useMemo(
    () => currencyItemsAll.reduce((sum, i) => sum + i.value, 0),
    [currencyItemsAll],
  );

  const accountsById = useMemo(() => new Map(accountItemsAll.map((i) => [i.id, i])), [accountItemsAll]);

  const accountsColors = useMemo<PieSvgProps<Datum>['colors']>(
    () => (d) => accountsById.get(String((d as any).id))?.color ?? DEFAULT_COLOR,
    [accountsById],
  );

  const currenciesColors = useMemo<PieSvgProps<Datum>['colors']>(
    () => (d) => CURRENCY_COLORS[String((d as any).id)] ?? DEFAULT_COLOR,
    [],
  );

  const accountsPieData: Datum[] = useMemo(
    () => accountItemsAll.map((i) => ({ id: i.id, label: i.name, value: i.value })),
    [accountItemsAll],
  );

  const currenciesPieData: Datum[] = useMemo(
    () => currencyItemsAll.map((i) => ({ id: i.id, label: i.name, value: i.value })),
    [currencyItemsAll],
  );

  const accountsInCurrencyPieData: Datum[] = useMemo(
    () => currencyAccounts.map((i) => ({ id: i.id, label: i.name, value: i.value })),
    [currencyAccounts],
  );

  const accountsTooltip = useCallback(
    ({ datum }: { datum: { data: Datum; value: number } }) => {
      const id = String(datum.data.id);
      const item = accountsById.get(id);
      const value = datum.value;
      const percent = totalAccounts > 0 ? (value / totalAccounts) * 100 : 0;

      return (
        <DonutTooltip
          extra={item ? renderNativeLine(item.amount, item.currency) : null}
          label={String(datum.data.label)}
          percent={percent}
          value={value}
        />
      );
    },
    [accountsById, totalAccounts],
  );

  const currenciesTooltip = useCallback(
    ({ datum }: { datum: { data: Datum; value: number } }) => {
      const id = String(datum.data.id);
      const value = datum.value;
      const percent = currenciesGrandTotal > 0 ? (value / currenciesGrandTotal) * 100 : 0;

      const amount = currencyItemsAll.find((x) => String(x.id) === id)?.amount;
      const currency = currencyItemsAll.find((x) => String(x.id) === id)?.currency;

      return (
        <DonutTooltip
          extra={typeof amount === 'number' ? renderNativeLine(amount, currency ?? id) : null}
          label={String(datum.data.label)}
          percent={percent}
          value={value}
        />
      );
    },
    [currenciesGrandTotal, currencyItemsAll],
  );

  const accountsInCurrencyTooltip = useCallback(
    ({ datum }: { datum: { data: Datum; value: number } }) => {
      const id = String(datum.data.id);
      const item = accountsById.get(id);
      const value = datum.value;
      const percent = currencyTotal > 0 ? (value / currencyTotal) * 100 : 0;

      return (
        <DonutTooltip
          extra={item ? renderNativeLine(item.amount, item.currency) : null}
          label={String(datum.data.label)}
          percent={percent}
          value={value}
        />
      );
    },
    [accountsById, currencyTotal],
  );

  if (isLoading) return <CardSkeleton />;

  if (tab === 'accounts') {
    return (
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <Chart animate colors={accountsColors} data={accountsPieData} tooltip={accountsTooltip} />
        <DistributionTable
          ariaLabel="Accounts distribution list"
          getDotColor={(i) => i.color ?? DEFAULT_COLOR}
          items={accountItemsAll}
          total={totalAccounts}
        />
      </div>
    );
  }

  if (tab === 'currencies' && !selectedCurrency) {
    return (
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <Chart
          animate
          colors={currenciesColors}
          data={currenciesPieData}
          tooltip={currenciesTooltip}
          onClick={(node) => onCurrencySelect(String(node.data.id))}
        />
        <DistributionTable
          ariaLabel="Currencies distribution list"
          getDotColor={(i) => CURRENCY_COLORS[String(i.id)] ?? DEFAULT_COLOR}
          items={currencyItemsAll}
          total={currenciesGrandTotal}
          onRowClick={onCurrencySelect}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <Chart animate colors={accountsColors} data={accountsInCurrencyPieData} tooltip={accountsInCurrencyTooltip} />
      <DistributionTable
        ariaLabel={`Accounts in ${selectedCurrency} distribution list`}
        getDotColor={(i) => i.color ?? DEFAULT_COLOR}
        items={currencyAccounts}
        total={currencyTotal}
      />
    </div>
  );
};

export default AccountsCurrenciesPanel;
