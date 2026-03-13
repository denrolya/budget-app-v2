import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { cn } from '@/lib/utils';
import type Transfer from '@/features/transfers/models/Transfer';
import { AccountPill } from '@/features/accounts';
import { TransactionListItem } from '@/features/transactions';
import RateDisplay from '@/features/transfers/components/RateDisplay';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransferDetailsProps {
  transfer: Transfer;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Terminal-style key/value row. Label is fixed-width monospace uppercase,
 * value slot is the right-hand side content.
 */
const DataRow: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => (
  <div className={cn('flex items-start gap-3 py-0.5', className)}>
    <span className="w-20 shrink-0 font-mono text-3xs uppercase tracking-widest text-muted-foreground leading-5 select-none">
      {label}
    </span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

/**
 * Section divider with an optional label, terminal-style dashed rule.
 */
const SectionDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-2 my-3">
    <span className="font-mono text-3xs uppercase tracking-widest text-muted-foreground/50 select-none whitespace-nowrap">
      {label ?? ''}
    </span>
    <div className="flex-1 border-t border-dashed border-border/40" />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const Details: React.FC<TransferDetailsProps> = ({ transfer }) => {
  const feePercentage =
    transfer.hasFee() && transfer.feeExpense ? ((transfer.feeExpense.amount / transfer.amount) * 100).toFixed(2) : null;

  const senderTotal =
    transfer.feeExpense?.account.id === transfer.fromExpense.account.id
      ? -(transfer.fromExpense.amount + transfer.feeExpense!.amount)
      : -transfer.fromExpense.amount;

  const recipientTotal =
    transfer.feeExpense?.account.id === transfer.toIncome.account.id
      ? transfer.feeExpense!.amount + transfer.toIncome.amount
      : transfer.toIncome.amount;

  const senderCurrency = transfer.fromExpense.account.currency;
  const recipientCurrency =
    transfer.feeExpense?.account.id === transfer.toIncome.account.id
      ? transfer.feeExpense!.account.currency
      : transfer.toIncome.account.currency;

  return (
    <div className="font-mono text-xs">
      {/* ── Core transfer data ────────────────────────────────────────────────── */}

      <DataRow label="Amount">
        <MoneyValue
          amount={transfer.amount}
          currency={transfer.fromExpense.account.currency}
          useColors={false}
          className="font-mono text-sm font-semibold"
        />
      </DataRow>

      <DataRow label="From">
        <AccountPill account={transfer.fromExpense.account} size="sm" variant="inline" />
      </DataRow>

      <DataRow label="To">
        <AccountPill account={transfer.toIncome.account} size="sm" variant="inline" />
      </DataRow>

      <DataRow label="Rate">
        <RateDisplay
          useSymbol
          transfer={transfer}
          className="font-mono text-xs tracking-tighter text-muted-foreground"
        />
      </DataRow>

      <DataRow label="Date">
        <RelativeDatetimeDisplay
          date={transfer.executedAt}
          showDayBadge={false}
          showRelative={false}
          variant="default"
          className="font-mono text-xs text-muted-foreground"
        />
      </DataRow>

      {/* ── Related transactions ──────────────────────────────────────────────── */}
      <SectionDivider label="Related Transactions" />

      {/* Sender */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-3xs uppercase tracking-widest text-muted-foreground">Sender</span>
          <MoneyValue showSign amount={senderTotal} currency={senderCurrency} className="font-mono text-xs" />
        </div>
        <TransactionListItem flat transaction={transfer.fromExpense} />
      </div>

      {/* Recipient */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-3xs uppercase tracking-widest text-muted-foreground">Recipient</span>
          <MoneyValue showSign amount={recipientTotal} currency={recipientCurrency} className="font-mono text-xs" />
        </div>
        <TransactionListItem flat transaction={transfer.toIncome} />
      </div>

      {/* ── Fee ───────────────────────────────────────────────────────────────── */}
      {transfer.hasFee() && transfer.feeExpense && (
        <>
          <SectionDivider label="Fee" />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase tracking-widest text-muted-foreground">Transfer Fee</span>
              <div className="flex items-center gap-2">
                <MoneyValue
                  showSign
                  amount={-transfer.feeExpense.amount}
                  currency={transfer.feeExpense.account.currency}
                  className="font-mono text-xs font-medium"
                />
                {feePercentage && <span className="text-3xs text-destructive/75 font-mono">({feePercentage}%)</span>}
              </div>
            </div>
            <TransactionListItem flat transaction={transfer.feeExpense} />
          </div>
        </>
      )}
    </div>
  );
};

export default Details;
