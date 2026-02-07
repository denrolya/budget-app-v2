import type { PieSvgProps } from '@nivo/pie';
import sortBy from 'lodash/sortBy';
import moment from 'moment';
import React, { useCallback, useMemo } from 'react';

import AccountPill from '@/features/accounts/components/Pill';
import { CURRENCIES } from '@/constants/currency';
import MoneyValue from '@/components/common/MoneyValue';

import CardSkeleton from './CardSkeleton';
import Chart from './Chart';
import { CURRENCY_COLORS, DEFAULT_COLOR } from './constants';
import DistributionList from './DistributionList';
import DonutTooltip from './DonutTooltip';
import type { DrawerListingTarget } from './TransactionsDrawer';
import type { Datum, Item, TabKey } from './types';

type AccountModel = {
  id: number | string;
  name: string;
  displayName?: string | null;
  currency?: string | null;
  color?: string | null;
};

type AccountDistributionStat = {
  account: AccountModel;
  value?: number | null;
  amount?: number | null;
};

interface Props {
  tab: TabKey;
  timeframe: { after: moment.Moment; before: moment.Moment };
  showMonthlyAverage: boolean;

  selectedCurrency: string | null;
  onCurrencySelect: (id: string) => void;

  accountStats: AccountDistributionStat[];
  totalAccountsRaw: number;

  isLoading: boolean;

  onOpenTransactions: (target: DrawerListingTarget) => void;
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
                                                    onOpenTransactions,
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

  const applyMonthly = useCallback((v: number) => (showMonthlyAverage ? calcMonthlyAverage(v) : v), [
    showMonthlyAverage,
    calcMonthlyAverage,
  ]);

  const accountItemsAll: Item[] = useMemo(() => {
    const items: Item[] = accountStats.map((s) => ({
      id: String(s.account.id),
      name: s.account.displayName ?? s.account.name,
      value: applyMonthly(s.value ?? 0),
      amount: applyMonthly(s.amount ?? 0),
      currency: s.account.currency,
      color: s.account.color ?? null,
      account: s.account,
    }));
    return sortBy(items, 'value');
  }, [accountStats, applyMonthly]);

  const currencyToAccountIds = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const stat of accountStats) {
      const code = stat.account.currency ?? '—';
      const list = map.get(code) ?? [];
      list.push(String(stat.account.id));
      map.set(code, list);
    }
    return map;
  }, [accountStats]);

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

  const currencyAccounts = useMemo(() => {
    if (!selectedCurrency) return [];
    return accountItemsAll.filter((i) => (i.currency ?? '—') === selectedCurrency);
  }, [accountItemsAll, selectedCurrency]);

  const currencyTotal = useMemo(() => currencyAccounts.reduce((sum, i) => sum + i.value, 0), [currencyAccounts]);
  const currenciesGrandTotal = useMemo(() => currencyItemsAll.reduce((sum, i) => sum + i.value, 0), [currencyItemsAll]);

  const accountsById = useMemo(() => new Map(accountItemsAll.map((i) => [String(i.id), i])), [accountItemsAll]);
  const currenciesById = useMemo(() => new Map(currencyItemsAll.map((i) => [String(i.id), i])), [currencyItemsAll]);

  const accountsColors = useMemo<PieSvgProps<Datum>['colors']>(
    () => (d) => accountsById.get(String((d as { id: string | number }).id))?.color ?? DEFAULT_COLOR,
    [accountsById],
  );

  const currenciesColors = useMemo<PieSvgProps<Datum>['colors']>(
    () => (d) => CURRENCY_COLORS[String((d as { id: string | number }).id)] ?? DEFAULT_COLOR,
    [],
  );

  const accountsPieData: Datum[] = useMemo(
    () => accountItemsAll.map((i) => ({ id: String(i.id), label: i.name, value: i.value })),
    [accountItemsAll],
  );

  const currenciesPieData: Datum[] = useMemo(
    () => currencyItemsAll.map((i) => ({ id: String(i.id), label: i.name, value: i.value })),
    [currencyItemsAll],
  );

  const accountsInCurrencyPieData: Datum[] = useMemo(
    () => currencyAccounts.map((i) => ({ id: String(i.id), label: i.name, value: i.value })),
    [currencyAccounts],
  );

  const accountsTooltip = useCallback(
    ({ datum }: { datum: { data: Datum; value: number } }) => {
      const item = accountsById.get(String(datum.data.id));
      const value = datum.value;
      const percent = totalAccounts > 0 ? (value / totalAccounts) * 100 : 0;

      return (
        <DonutTooltip
          label={String(datum.data.label)}
          percent={percent}
          value={value}
          extra={item && (
            <MoneyValue
              amount={item.amount}
              currency={item.currency}
              useColors={false}
              className="text-2xs leading-4 text-muted-foreground"
            />
          )}
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

      const item = currenciesById.get(id);
      return (
        <DonutTooltip
          label={String(datum.data.label)}
          percent={percent}
          value={value}
          extra={item && (
            <MoneyValue
              amount={item.amount}
              currency={item.currency}
              useColors={false}
              className="text-2xs leading-4 text-muted-foreground"
            />
          )}
        />
      );
    },
    [currenciesGrandTotal, currenciesById],
  );

  const accountsInCurrencyTooltip = useCallback(
    ({ datum }: { datum: { data: Datum; value: number } }) => {
      const item = accountsById.get(String(datum.data.id));
      const value = datum.value;
      const percent = currencyTotal > 0 ? (value / currencyTotal) * 100 : 0;

      return (
        <DonutTooltip
          label={String(datum.data.label)}
          percent={percent}
          value={value}
          extra={item && (
            <MoneyValue
              amount={item.amount}
              currency={item.currency}
              useColors={false}
              className="text-2xs leading-4 text-muted-foreground"
            />
          )}
        />
      );
    },
    [accountsById, currencyTotal],
  );

  const openAccountTransactions = useCallback(
    (id: string) => {
      const item = accountsById.get(String(id));
      const title = item ? `Transactions in ${item.name}` : 'Transactions';
      onOpenTransactions({ title, initialFilters: { accounts: [String(id)] } });
    },
    [accountsById, onOpenTransactions],
  );

  const openCurrencyTransactions = useCallback(
    (currencyCode: string) => {
      const ids = currencyToAccountIds.get(String(currencyCode)) ?? [];
      if (!ids.length) return;

      const item = currenciesById.get(String(currencyCode));
      const title = item ? `Transactions in ${item.name}` : `Transactions in ${currencyCode}`;

      onOpenTransactions({ title, initialFilters: { accounts: ids } });
    },
    [currencyToAccountIds, currenciesById, onOpenTransactions],
  );

  if (isLoading) return <CardSkeleton />;

  if (tab === 'accounts') {
    return (
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <Chart animate colors={accountsColors} data={accountsPieData} tooltip={accountsTooltip} />
        <DistributionList
          ariaLabel="Accounts distribution list"
          items={accountItemsAll}
          total={totalAccounts}
          renderLabel={({ item, percentage }) => (
            <div className="min-w-0 flex items-center gap-2 text-sm leading-5 [&_*]:text-sm [&_*]:leading-5">
              {'account' in item && item.account ? (
                <AccountPill account={item.account} tooltip={false} variant="inline" className="min-w-0" />
              ) : (
                <span className="truncate">{item.name}</span>
              )}
              {item.value > 0 ? (
                <small className="text-xs text-muted-foreground shrink-0">({percentage.toFixed(0)}%)</small>
              ) : null}
            </div>
          )}
          onViewTransactions={openAccountTransactions}
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
        <DistributionList
          ariaLabel="Currencies distribution list"
          getDotColor={(i) => CURRENCY_COLORS[String(i.id)] ?? DEFAULT_COLOR}
          items={currencyItemsAll}
          total={currenciesGrandTotal}
          renderTooltip={({ item }) => (
            <>
              <code className="font-mono text-xs">{String(item.id)}</code>: <span>{item.name}</span>
            </>
          )}
          onRowClick={onCurrencySelect}
          onViewTransactions={openCurrencyTransactions}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <Chart animate colors={accountsColors} data={accountsInCurrencyPieData} tooltip={accountsInCurrencyTooltip} />
      <DistributionList
        ariaLabel={`Accounts in ${selectedCurrency ?? ''} distribution list`}
        items={currencyAccounts}
        total={currencyTotal}
        renderLabel={({ item, percentage }) => (
          <div className="min-w-0 flex items-center gap-2 text-sm leading-5 [&_*]:text-sm [&_*]:leading-5">
            {'account' in item && item.account ? (
              <AccountPill account={item.account} tooltip={false} variant="inline" className="min-w-0" />
            ) : (
              <span className="truncate">{item.name}</span>
            )}
            {item.value > 0 ? (
              <small className="text-xs text-muted-foreground shrink-0">({percentage.toFixed(0)}%)</small>
            ) : null}
          </div>
        )}
        onViewTransactions={openAccountTransactions}
      />
    </div>
  );
};

export default AccountsCurrenciesPanel;
