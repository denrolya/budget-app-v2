import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import moment, { type Moment } from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLedger } from '@/features/ledger';
import LedgerActivityCard from '@/features/ledger/components/LedgerActivityCard';
import { BACKEND_DATE_FORMAT, MOMENT_DATE_VIEW_FORMAT } from '@/constants/datetime';
import type { DailyStatsResponse } from '@/features/accounts/api/service';
import { useBaseCurrency } from '@/features/auth';
import { type Transaction } from '@/features/transactions';
import TransactionHeatmapChart from '@/features/transactions/components/TransactionHeatmapChart';
import { useIsMobile } from '@/hooks/use-mobile';

import { useTransactions as useDebtTransactions } from '../api';
import type Debt from '../models/Debt';

import DebtBalanceChart from './DebtBalanceChart';

interface Props {
  debt: Debt;
}

const DebtDetails: React.FC<Props> = ({ debt }) => {
  const [activeTab, setActiveTab] = useState('transactions');
  const isMobile = useIsMobile();
  // Fetch transactions for this debt directly (list API doesn't embed them in the Debt model)
  const { data: transactions = [] } = useDebtTransactions(debt.id);

  const defaultRange = useMemo(
    () => ({
      after: moment().subtract(90, 'days').startOf('day'),
      before: moment().endOf('day'),
    }),
    [],
  );

  const ledger = useLedger({
    updateUrl: false,
    omitTransfers: true,
    initialShowEmptyDays: false,
    initialFilters: { debts: [debt.id] },
    initialTimeframe: defaultRange,
  });

  const handleHeatmapRangeSelect = useCallback(
    (after: moment.Moment, before: moment.Moment) => {
      ledger.setTimeframe({ after, before });
    },
    [ledger],
  );

  const handleHeatmapRangeClear = useCallback(() => {
    ledger.setTimeframe(defaultRange);
  }, [ledger, defaultRange]);

  const handleHeatmapViewModeChange = useCallback(
    (mode: 'count' | 'income' | 'expense') => {
      ledger.setFilter('type', mode === 'count' ? undefined : mode);
    },
    [ledger],
  );

  const handleHeatmapYearChange = useCallback(
    (year: number, onRangeReset: () => void) => {
      const after = moment({ year }).startOf('year');
      const before = year === moment().year() ? moment().endOf('day') : moment({ year }).endOf('year');
      ledger.setTimeframe({ after, before });
      onRangeReset();
    },
    [ledger],
  );

  const handleLedgerReset = useCallback(() => {
    ledger.resetAll();
    ledger.setFilter('debts', [debt.id]);
  }, [ledger, debt.id]);

  const baseCurrency = useBaseCurrency();

  const groupedTransactions: [Moment, Transaction[], number, number][] = useMemo(
    () =>
      toPairs(
        groupBy(
          sortBy(transactions, (item) => -item.executedAt.valueOf()),
          (item) => item.executedAt.format(BACKEND_DATE_FORMAT),
        ),
      ).map(([date, items]) => {
        const totalValue = sumBy(items, (item) => {
          const value = item.convertedValues[baseCurrency] || 0;
          return item.isExpense() ? -value : value;
        });
        const totalItems = items.length;
        return [moment(date), items, totalValue, totalItems];
      }),
    [transactions, baseCurrency],
  );

  const totalTransactionsValue = groupedTransactions.reduce((acc, [, , totalValue]) => acc + totalValue, 0);
  const totalTransactionsCount = transactions.length;

  const firstTransactionAt = transactions.length
    ? sortBy(transactions, (tx) => tx.executedAt.valueOf())[0]?.executedAt
    : null;
  const latestTransactionAt = transactions.length
    ? sortBy(transactions, (tx) => -tx.executedAt.valueOf())[0]?.executedAt
    : null;

  // All-years daily stats for the heatmap — the chart filters to the active year internally.
  const dailyStats = useMemo<DailyStatsResponse>(() => {
    const perDay = new Map<
      string,
      { count: number; convertedValues: Record<string, { income: number; expense: number }> }
    >();

    for (const tx of transactions) {
      const day = tx.executedAt.format(BACKEND_DATE_FORMAT);
      const dayEntry = perDay.get(day) ?? { count: 0, convertedValues: {} };
      dayEntry.count += 1;

      const currency = tx.account.currency;
      const amount = Math.abs(tx.amount);
      const currencyEntry = dayEntry.convertedValues[currency] ?? { income: 0, expense: 0 };

      if (tx.isExpense()) {
        currencyEntry.expense += amount;
      } else {
        currencyEntry.income += amount;
      }

      dayEntry.convertedValues[currency] = currencyEntry;
      perDay.set(day, dayEntry);
    }

    return {
      data: Array.from(perDay.entries())
        .map(([day, value]) => ({
          day,
          count: value.count,
          convertedValues: value.convertedValues,
        }))
        .sort((a, b) => a.day.localeCompare(b.day)),
    };
  }, [transactions]);

  const historyEvents = useMemo(() => {
    const events: { id: string; date: Moment; action: string; details: string }[] = [];

    events.push({
      id: `debt-created-${debt.id}`,
      date: debt.createdAt,
      action: 'Debt created',
      details: `Initial balance: ${debt.balance.toLocaleString()} ${debt.currency}`,
    });

    if (debt.closedAt) {
      events.push({
        id: `debt-closed-${debt.id}`,
        date: debt.closedAt,
        action: 'Debt closed',
        details: 'This debt has been marked as closed.',
      });
    }

    for (const tx of transactions) {
      const sign = tx.isExpense() ? '-' : '+';
      const details = [
        `${sign}${Math.abs(tx.amount).toLocaleString()} ${tx.account.currency}`,
        tx.category.name,
        tx.account.name,
        tx.note?.trim() ? `Note: ${tx.note.trim()}` : null,
      ]
        .filter(Boolean)
        .join(' • ');

      events.push({
        id: `tx-${tx.id}`,
        date: tx.executedAt,
        action: tx.isExpense() ? 'Repayment / outgoing transaction' : 'Incoming transaction',
        details,
      });
    }

    return sortBy(events, (event) => -event.date.valueOf());
  }, [debt, transactions]);

  const statusBadgeVariant = debt.isClosed() ? BadgeVariant.Warning : BadgeVariant.Success;
  const statusBadgeLabel = debt.isClosed() ? 'Closed' : 'Open';

  return (
    <div className="h-full min-w-0 flex flex-col">
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4">
        <Card className="mb-4 min-w-0">
          <CardHeader>
            <CardTitle className="flex items-start justify-between gap-3 min-w-0">
              <span title={debt.debtor} className="min-w-0 truncate">
                {debt.debtor}
              </span>
              <span className="shrink-0">
                <MoneyValue badge amount={debt.balance} currency={debt.currency} values={debt.convertedValues} />
              </span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant={statusBadgeVariant}>{statusBadgeLabel}</Badge>
              {debt.closedAt && <span>Closed on {debt.closedAt.format(MOMENT_DATE_VIEW_FORMAT)}</span>}
            </CardDescription>
          </CardHeader>

          {transactions.length > 1 && (
            <div className="border-b">
              <DebtBalanceChart currency={debt.currency} currentBalance={debt.balance} transactions={transactions} />
            </div>
          )}

          {(totalTransactionsCount > 0 || debt.note) && (
            <CardContent className="min-w-0 pt-0 pb-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground border-t pt-3">
                <span>
                  Opened: <RelativeDatetimeDisplay date={debt.createdAt} />
                </span>
                {debt.updatedAt && (
                  <>
                    <span className="text-border select-none">·</span>
                    <span>
                      Updated: <RelativeDatetimeDisplay date={debt.updatedAt} />
                    </span>
                  </>
                )}
                {totalTransactionsCount > 0 && (
                  <>
                    <span className="text-border select-none">·</span>
                    <span>
                      {totalTransactionsCount} transaction{totalTransactionsCount !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
                {firstTransactionAt && (
                  <>
                    <span className="text-border select-none">·</span>
                    <span>
                      First: <RelativeDatetimeDisplay date={firstTransactionAt} />
                    </span>
                  </>
                )}
                {latestTransactionAt && (
                  <>
                    <span className="text-border select-none">·</span>
                    <span>
                      Latest: <RelativeDatetimeDisplay date={latestTransactionAt} />
                    </span>
                  </>
                )}
                {totalTransactionsCount > 0 && (
                  <>
                    <span className="text-border select-none">·</span>
                    <span className="font-medium">
                      Net: <MoneyValue showSign amount={totalTransactionsValue} currency={baseCurrency} values={{}} />
                    </span>
                  </>
                )}
              </div>
              {debt.note && <p className="mt-2 text-xs text-muted-foreground break-words">{debt.note}</p>}
            </CardContent>
          )}
        </Card>

        <Tabs value={activeTab} className="min-w-0" onValueChange={setActiveTab}>
          <TabsList className={isMobile ? 'grid w-full grid-cols-2' : ''}>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="history">Debt History</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="min-w-0 flex flex-col min-h-[400px]">
            <LedgerActivityCard
              disabledFilters={['debts']}
              ledger={ledger}
              heatmap={({ onRangeSelect, onRangeClear, onRangeReset, year }) => (
                <div className="border-b overflow-x-auto">
                  <TransactionHeatmapChart
                    currency={baseCurrency}
                    data={dailyStats}
                    highlightDates={ledger.visibleDates}
                    isLoading={ledger.transactionsState.isLoading && transactions.length === 0}
                    selectable={true}
                    year={year}
                    onRangeClear={onRangeClear}
                    onRangeSelect={onRangeSelect}
                    onViewModeChange={handleHeatmapViewModeChange}
                    onYearChange={(y) => handleHeatmapYearChange(y, onRangeReset)}
                  />
                </div>
              )}
              onHeatmapRangeClear={handleHeatmapRangeClear}
              onHeatmapRangeSelect={handleHeatmapRangeSelect}
              onReset={handleLedgerReset}
            />
          </TabsContent>

          <TabsContent value="history" className="min-w-0">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Debt History</CardTitle>
                <CardDescription>Timeline of actions and related transactions</CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                <ScrollArea className="h-[300px] w-full">
                  <ul className="space-y-4">
                    {historyEvents.map((event) => (
                      <li className="flex items-start justify-between gap-3 min-w-0" key={event.id}>
                        <div className="min-w-0">
                          <p className="font-medium break-words">{event.action}</p>
                          <p className="text-sm text-muted-foreground break-words">{event.details}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {event.date.format(MOMENT_DATE_VIEW_FORMAT)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};

export default DebtDetails;
