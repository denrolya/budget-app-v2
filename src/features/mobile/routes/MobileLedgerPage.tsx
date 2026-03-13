import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountMarker from '@/features/accounts/components/AccountMarker';
import { useLedger } from '@/features/ledger';
import { Transaction } from '@/features/transactions';
import { useActiveAccountsWithDefaultOrder } from '@/hooks/financeData';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/formatMoney';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

const MobileLedgerPage: React.FC = () => {
  const accounts = useActiveAccountsWithDefaultOrder();
  const [activeDays, setActiveDays] = useState(30);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);

  const defaultRange = useMemo(
    () => ({
      after: moment().subtract(activeDays, 'days').startOf('day'),
      before: moment().endOf('day'),
    }),
    // intentionally omit activeDays — only used as mount value; updates go via setTimeframe
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const ledger = useLedger({
    updateUrl: false,
    omitTransfers: true,
    initialShowEmptyDays: false,
    initialTimeframe: defaultRange,
  });

  const handlePreset = useCallback(
    (days: number) => {
      setActiveDays(days);
      ledger.setTimeframe({
        after: moment().subtract(days, 'days').startOf('day'),
        before: moment().endOf('day'),
      });
    },
    [ledger],
  );

  const handleAccount = useCallback(
    (id: number | null) => {
      setActiveAccountId(id);
      ledger.setFilter('accounts', id ? [id] : undefined);
    },
    [ledger],
  );

  const totalItems = ledger.transactionsState.pagination.totalItems;

  return (
    <div className="flex flex-col h-full">
      {/* Control bar */}
      <div className="shrink-0 border-b border-border bg-background">
        {/* Period row */}
        <div className="flex items-center gap-1 px-3 pt-2.5 pb-1.5">
          <span className="font-mono text-2xs uppercase tracking-widest text-muted-foreground mr-1">period</span>
          {PRESETS.map(({ label, days }) => (
            <button
              type="button"
              className={cn(
                'h-6 px-2 rounded border font-mono text-2xs uppercase tracking-wider transition-colors',
                activeDays === days
                  ? 'bg-muted text-foreground border-border'
                  : 'text-muted-foreground border-transparent hover:border-border',
              )}
              key={label}
              onClick={() => handlePreset(days)}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto font-mono text-2xs text-muted-foreground tabular-nums">
            {totalItems} tx
          </span>
        </div>

        {/* Account chips — horizontally scrollable */}
        <div className="flex items-center gap-1 px-3 pb-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            type="button"
            className={cn(
              'h-6 px-2 rounded border font-mono text-2xs shrink-0 transition-colors',
              !activeAccountId
                ? 'bg-muted text-foreground border-border'
                : 'text-muted-foreground border-transparent hover:border-border',
            )}
            onClick={() => handleAccount(null)}
          >
            all
          </button>

          {accounts.map((account) => (
            <button
              type="button"
              className={cn(
                'h-6 px-2 rounded border font-mono text-2xs shrink-0 flex items-center gap-1.5 transition-colors',
                activeAccountId === account.id
                  ? 'bg-muted text-foreground border-border'
                  : 'text-muted-foreground border-transparent hover:border-border',
              )}
              key={account.id}
              onClick={() => handleAccount(account.id)}
            >
              <AccountMarker account={account} size="sm" />
              <span className="truncate max-w-[6rem]">{account.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {ledger.isLoading && (
          <p className="font-mono text-2xs text-muted-foreground text-center py-10">loading…</p>
        )}

        {!ledger.isLoading && ledger.groupedItems.length === 0 && (
          <p className="font-mono text-2xs text-muted-foreground text-center py-10">no transactions</p>
        )}

        {ledger.groupedItems.map(([date, items, txValue]) => (
          <div key={date.format('YYYY-MM-DD')}>
            {/* Day header — sticky */}
            <div className="sticky top-0 flex items-center justify-between px-3 py-1 bg-muted/60 backdrop-blur-sm border-y border-border/40 z-10">
              <span className="font-mono text-2xs text-muted-foreground">{date.format('D MMM YYYY')}</span>
              <MoneyValue
                showSign
                useColors
                amount={txValue}
                showValuesTooltip={false}
                className="font-mono text-2xs tabular-nums"
              />
            </div>

            {/* Rows */}
            {items.map((item) => {
              if (!(item instanceof Transaction)) return null;
              const isExpense = item.isExpense();

              return (
                <div
                  className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border/30 last:border-0"
                  key={item.id}
                >
                  <AccountMarker account={item.account} size="sm" />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{item.category.name}</p>
                    {item.note?.trim() && (
                      <p className="font-mono text-2xs text-muted-foreground truncate">{item.note}</p>
                    )}
                  </div>

                  <span
                    className={cn(
                      'font-mono text-xs tabular-nums shrink-0',
                      isExpense ? 'text-destructive' : 'text-success',
                    )}
                  >
                    {isExpense ? '−' : '+'}
                    {formatMoney(Math.abs(item.amount), item.account.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileLedgerPage;
