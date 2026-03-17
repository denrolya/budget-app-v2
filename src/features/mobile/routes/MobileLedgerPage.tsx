import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import MobileDateNavigation from '@/components/common/MobileDateNavigation';
import MoneyValue from '@/components/common/MoneyValue';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import AccountMarker from '@/features/accounts/components/AccountMarker';
import { useLedger } from '@/features/ledger';
import { Transaction } from '@/features/transactions';
import { TransactionValue } from '@/features/transactions/components/TransactionValue';
import { useActiveAccountsWithDefaultOrder } from '@/hooks/financeData';
import { cn } from '@/lib/utils';

// ─── Transaction detail drawer ──────────────────────────────────────────────

const TransactionDetailDrawer: React.FC<{
  tx: Transaction | null;
  open: boolean;
  onClose: () => void;
}> = ({ tx, open, onClose }) => (
  <Drawer
    open={open}
    onOpenChange={(v) => {
      if (!v) onClose();
    }}
  >
    <DrawerContent style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
      <DrawerHeader className="pb-4">
        <DrawerTitle className="font-mono text-sm">Transaction</DrawerTitle>
      </DrawerHeader>
      {tx && (
        <dl className="space-y-3 text-sm px-4 pb-4">
          <div className="flex justify-between items-center">
            <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Type</dt>
            <dd className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold uppercase tracking-wider border',
                  tx.isIncome()
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-destructive/10 text-destructive border-destructive/20',
                )}
              >
                {tx.type}
              </span>
              {tx.isDraft && (
                <span className="text-2xs font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-warning/10 text-warning-foreground border-warning/20">
                  draft
                </span>
              )}
            </dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Amount</dt>
            <dd>
              <TransactionValue
                alwaysShowConversion
                revert
                showSign
                transaction={tx}
                className="font-mono text-base tabular-nums font-semibold"
              />
            </dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Account</dt>
            <dd className="flex items-center gap-1.5 text-sm">
              <AccountMarker account={tx.account} size="sm" />
              {tx.account.name}
            </dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Date</dt>
            <dd className="font-mono text-sm tabular-nums">{tx.executedAt.format('D MMM YYYY HH:mm')}</dd>
          </div>
          <div className="flex justify-between items-start">
            <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Category</dt>
            <dd className="text-right">
              <p className="text-sm">{tx.category.name}</p>
              <p className="font-mono text-2xs text-muted-foreground">{tx.category.getFullPath().join(' › ')}</p>
            </dd>
          </div>
          {tx.debt?.debtor && (
            <div className="flex justify-between items-center">
              <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Debtor</dt>
              <dd className="text-sm">{tx.debt.debtor}</dd>
            </div>
          )}
          {tx.note?.trim() && (
            <div className="flex justify-between items-start gap-4">
              <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground shrink-0">Note</dt>
              <dd className="text-sm text-right break-words">{tx.note.trim()}</dd>
            </div>
          )}
        </dl>
      )}
    </DrawerContent>
  </Drawer>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const MobileLedgerPage: React.FC = () => {
  const accounts = useActiveAccountsWithDefaultOrder();
  const location = useLocation();
  const locationAccountId = (location.state as { accountId?: number } | null)?.accountId ?? null;

  const [activeAccountId, setActiveAccountId] = useState<number | null>(locationAccountId);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const defaultRange = useMemo(
    () => ({
      after: moment().subtract(30, 'days').startOf('day'),
      before: moment().endOf('day'),
    }),
    [],
  );

  const ledger = useLedger({
    updateUrl: false,
    omitTransfers: true,
    initialPerPage: 500,
    initialShowEmptyDays: false,
    initialTimeframe: defaultRange,
    initialFilters: locationAccountId ? { accounts: [locationAccountId] } : undefined,
  });

  // Apply account filter from navigation state on mount
  useEffect(() => {
    if (locationAccountId) {
      ledger.setFilter('accounts', [locationAccountId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCustomRange = useCallback(
    (range: { after?: moment.Moment | null; before?: moment.Moment | null }) => {
      const after = range.after ? moment(range.after).startOf('day') : ledger.timeframe.after;
      const before = range.before ? moment(range.before).endOf('day') : ledger.timeframe.before;
      ledger.setTimeframe({ after, before });
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
      {/* Transaction list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {ledger.isLoading && <p className="font-mono text-xs text-muted-foreground text-center py-10">loading…</p>}

        {!ledger.isLoading && ledger.groupedItems.length === 0 && (
          <p className="font-mono text-xs text-muted-foreground text-center py-10">no transactions</p>
        )}

        {ledger.groupedItems.map(([date, items, txValue]) => (
          <div key={date.format('YYYY-MM-DD')}>
            {/* Day header — sticky */}
            <div className="sticky top-0 flex items-center justify-between px-3 py-1.5 bg-muted/60 backdrop-blur-sm border-y border-border/40 z-10">
              <span className="font-mono text-xs text-muted-foreground">{date.format('D MMM YYYY')}</span>
              <MoneyValue
                showSign
                useColors
                amount={txValue}
                showValuesTooltip={false}
                className="font-mono text-xs tabular-nums"
              />
            </div>

            {/* Rows */}
            {items.map((item) => {
              if (!(item instanceof Transaction)) return null;

              return (
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-3 border-b border-border/30 last:border-0 transition-colors text-left',
                    {
                      'bg-warning/20 active:bg-warning/30': item.isDraft,
                      'hover:bg-muted/30 active:bg-muted/50': !item.isDraft,
                    },
                  )}
                  key={item.id}
                  onClick={() => setSelectedTx(item)}
                >
                  <AccountMarker account={item.account} size="sm" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.category.name}</p>
                    {item.note?.trim() && (
                      <p className="font-mono text-xs text-muted-foreground truncate">{item.note}</p>
                    )}
                  </div>

                  <TransactionValue
                    alwaysShowConversion
                    revert
                    showSign
                    showValuesTooltip={false}
                    transaction={item}
                    className="font-mono text-sm tabular-nums shrink-0"
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Controls bar — bottom, thumb zone */}
      <div className="shrink-0 border-t border-border bg-background">
        {/* Period row */}
        <div className="flex items-center gap-1 px-3 pt-2 pb-1.5">
          <MobileDateNavigation
            after={ledger.timeframe.after}
            before={ledger.timeframe.before}
            className="flex-1"
            onChange={handleCustomRange}
          />
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{totalItems} tx</span>
        </div>

        {/* Account chips — horizontally scrollable */}
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            type="button"
            className={cn(
              'h-7 px-2.5 rounded border font-mono text-xs shrink-0 transition-colors',
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
                'h-7 px-2.5 rounded border font-mono text-xs shrink-0 flex items-center gap-1.5 transition-colors',
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

      {/* Transaction detail drawer */}
      <TransactionDetailDrawer open={!!selectedTx} tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
};

export default MobileLedgerPage;
