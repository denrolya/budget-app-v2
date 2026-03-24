import type { PieSvgProps } from '@nivo/pie';
import sortBy from 'lodash/sortBy';
import moment from 'moment';
import React, { useCallback, useMemo } from 'react';

import type { CURRENCY_CODE } from '@/constants/currency';
import { AccountPill } from '@/features/accounts';
import type Account from '@/features/accounts/models/Account';
import { CURRENCIES } from '@/constants/currency';
import MoneyValue from '@/components/common/MoneyValue';

import CardSkeleton from './CardSkeleton';
import Chart from './Chart';
import { getCurrencyColor, getDefaultColor } from './constants';
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

  const applyMonthly = useCallback(
    (value: number) => (showMonthlyAverage ? calcMonthlyAverage(value) : value),
    [showMonthlyAverage, calcMonthlyAverage],
  );

  const accountItemsAll: Item[] = useMemo(() => {
    const items: Item[] = accountStats.map((stat) => ({
      id: String(stat.account.id),
      name: stat.account.displayName ?? stat.account.name,
      value: applyMonthly(stat.value ?? 0),
      amount: applyMonthly(stat.amount ?? 0),
      currency: stat.account.currency,
      color: stat.account.color ?? null,
      account: stat.account,
    }));
    return sortBy(items, 'value').reverse();
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

    return sortBy(list, 'value').reverse();
  }, [accountStats, applyMonthly]);

  const totalAccounts = useMemo(() => applyMonthly(totalAccountsRaw ?? 0), [applyMonthly, totalAccountsRaw]);

  const currencyAccounts = useMemo(() => {
    if (!selectedCurrency) return [];
    return accountItemsAll.filter((item) => (item.currency ?? '—') === selectedCurrency);
  }, [accountItemsAll, selectedCurrency]);

  const currencyTotal = useMemo(() => currencyAccounts.reduce((sum, item) => sum + item.value, 0), [currencyAccounts]);
  const currenciesGrandTotal = useMemo(
    () => currencyItemsAll.reduce((sum, item) => sum + item.value, 0),
    [currencyItemsAll],
  );

  const accountsById = useMemo(
    () => new Map(accountItemsAll.map((item) => [String(item.id), item])),
    [accountItemsAll],
  );
  const currenciesById = useMemo(
    () => new Map(currencyItemsAll.map((item) => [String(item.id), item])),
    [currencyItemsAll],
  );

  const accountsColors = useMemo<PieSvgProps<Datum>['colors']>(
    () => (d) => accountsById.get(String((d as { id: string | number }).id))?.color ?? getDefaultColor(),
    [accountsById],
  );

  const currenciesColors = useMemo<PieSvgProps<Datum>['colors']>(
    () => (d) => getCurrencyColor(String((d as { id: string | number }).id)),
    [],
  );

  const accountsPieData: Datum[] = useMemo(
    () => accountItemsAll.map((item) => ({ id: String(item.id), label: item.name, value: item.value })),
    [accountItemsAll],
  );

  const currenciesPieData: Datum[] = useMemo(
    () => currencyItemsAll.map((item) => ({ id: String(item.id), label: item.name, value: item.value })),
    [currencyItemsAll],
  );

  const accountsInCurrencyPieData: Datum[] = useMemo(
    () => currencyAccounts.map((item) => ({ id: String(item.id), label: item.name, value: item.value })),
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
          extra={
            item && item.amount != null ? (
              <MoneyValue
                amount={item.amount}
                currency={item.currency != null ? (item.currency as CURRENCY_CODE) : undefined}
                useColors={false}
                className="text-2xs leading-4 text-muted-foreground"
              />
            ) : null
          }
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
          extra={
            item && item.amount != null ? (
              <MoneyValue
                amount={item.amount}
                currency={item.currency != null ? (item.currency as CURRENCY_CODE) : undefined}
                useColors={false}
                className="text-2xs leading-4 text-muted-foreground"
              />
            ) : null
          }
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
          extra={
            item && item.amount != null ? (
              <MoneyValue
                amount={item.amount}
                currency={item.currency != null ? (item.currency as CURRENCY_CODE) : undefined}
                useColors={false}
                className="text-2xs leading-4 text-muted-foreground"
              />
            ) : null
          }
        />
      );
    },
    [accountsById, currencyTotal],
  );

  const openAccountTransactions = useCallback(
    (accountId: string) => {
      const item = accountsById.get(String(accountId));
      const title = item ? `Transactions in ${item.name}` : 'Transactions';
      onOpenTransactions({ title, initialFilters: { accounts: [String(accountId)] } });
    },
    [accountsById, onOpenTransactions],
  );

  const openCurrencyTransactions = useCallback(
    (currencyCode: string) => {
      const item = currenciesById.get(String(currencyCode));
      const title = item ? `Transactions in ${item.name}` : `Transactions in ${currencyCode}`;
      onOpenTransactions({ title, initialFilters: { currencies: [String(currencyCode)] } });
    },
    [currenciesById, onOpenTransactions],
  );

  const accountRenderLabel = useCallback(({ item }: { item: Item; percentage: number }) => {
    const nameNode =
      'account' in item && item.account ? (
        <AccountPill
          account={item.account as unknown as Account}
          showMarker={false}
          size="sm"
          tooltip={false}
          variant="inline"
          className="min-w-0 text-2xs"
        />
      ) : (
        <span className="truncate text-2xs">{item.name}</span>
      );
    return <div className="min-w-0 [&_*]:min-w-0">{nameNode}</div>;
  }, []);

  if (isLoading) return <CardSkeleton />;

  // ── Accounts tab ─────────────────────────────────────────────────────────────
  if (tab === 'accounts') {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 h-[180px] relative">
          <Chart animate colors={accountsColors} data={accountsPieData} tooltip={accountsTooltip} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <MoneyValue amount={totalAccounts} useColors={false} className="text-sm font-bold font-mono tabular-nums" />
          </div>
        </div>
        <div className="border-t shrink-0" />
        <div className="flex-1 min-h-0 overflow-hidden">
          <DistributionList
            ariaLabel="Accounts distribution list"
            items={accountItemsAll}
            renderLabel={accountRenderLabel}
            total={totalAccounts}
            onViewTransactions={openAccountTransactions}
          />
        </div>
      </div>
    );
  }

  // ── Currencies tab (no selection) ─────────────────────────────────────────────
  if (tab === 'currencies' && !selectedCurrency) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 h-[180px] relative">
          <Chart
            animate
            colors={currenciesColors}
            data={currenciesPieData}
            tooltip={currenciesTooltip}
            onClick={(node) => onCurrencySelect(String(node.data.id))}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <MoneyValue
              amount={currenciesGrandTotal}
              useColors={false}
              className="text-sm font-bold font-mono tabular-nums"
            />
          </div>
        </div>
        <div className="border-t shrink-0" />
        <div className="flex-1 min-h-0 overflow-hidden">
          <DistributionList
            ariaLabel="Currencies distribution list"
            getDotColor={(item) => getCurrencyColor(String(item.id))}
            items={currencyItemsAll}
            total={currenciesGrandTotal}
            onRowClick={onCurrencySelect}
            onViewTransactions={openCurrencyTransactions}
          />
        </div>
      </div>
    );
  }

  // ── Currencies tab (currency selected — show accounts in that currency) ────────
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 h-[180px] relative">
        <Chart animate colors={accountsColors} data={accountsInCurrencyPieData} tooltip={accountsInCurrencyTooltip} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <MoneyValue amount={currencyTotal} useColors={false} className="text-sm font-bold font-mono tabular-nums" />
        </div>
      </div>
      <div className="border-t shrink-0" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <DistributionList
          ariaLabel={`Accounts in ${selectedCurrency ?? ''} distribution list`}
          items={currencyAccounts}
          renderLabel={accountRenderLabel}
          total={currencyTotal}
          onViewTransactions={openAccountTransactions}
        />
      </div>
    </div>
  );
};

export default AccountsCurrenciesPanel;
