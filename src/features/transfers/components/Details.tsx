import React, { useMemo } from 'react';

import { DataRow, SectionDivider } from '@/components/common/DetailPanel';
import MoneyValue from '@/components/common/MoneyValue';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { MOMENT_DATETIME_VIEW_FORMAT } from '@/constants/datetime';
import { formatTransferExchangeRate } from '@/lib/formatTransferExchangeRate';
import type Transfer from '@/features/transfers/models/Transfer';
import { AccountPill } from '@/features/accounts';
import { TransactionListItem } from '@/features/transactions';
import RateDisplay from '@/features/transfers/components/RateDisplay';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransferDetailsProps {
  transfer: Transfer;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Details: React.FC<TransferDetailsProps> = ({ transfer }) => {
  const senderCurrency = transfer.fromExpense.account.currency;
  const recipientCurrency = transfer.toIncome.account.currency;

  const stats = useMemo(() => {
    // All fees converted to sender currency for a single loss figure
    const totalFeesInSenderCurr = transfer.feeExpenses.reduce((sum, fee) => {
      const converted = fee.convertedValues?.[senderCurrency];
      return sum + (converted ?? fee.amount);
    }, 0);

    // Recipient-side fees in recipient currency
    const recipientFees = transfer.feeExpenses
      .filter((fee) => fee.account.id === transfer.toIncome.account.id)
      .reduce((sum, fee) => sum + fee.amount, 0);

    const feePct = transfer.amount > 0 ? (totalFeesInSenderCurr / transfer.amount) * 100 : 0;
    const totalCost = transfer.amount + totalFeesInSenderCurr;
    const netReceived = transfer.toIncome.amount - recipientFees;

    // Effective rate: what you actually got per unit spent
    const effectiveRate = totalCost > 0 ? netReceived / totalCost : transfer.rate;

    return { totalFeesInSenderCurr, feePct, totalCost, netReceived, effectiveRate };
  }, [transfer, senderCurrency]);

  const effRateRow =
    transfer.hasFee() && senderCurrency !== recipientCurrency
      ? (() => {
          const [from, to] = formatTransferExchangeRate([senderCurrency, recipientCurrency], stats.effectiveRate);
          const fromLabel = CURRENCIES[from.currency as CURRENCY_CODE]?.symbol ?? from.currency;
          const toLabel = CURRENCIES[to.currency as CURRENCY_CODE]?.symbol ?? to.currency;
          return (
            <DataRow label="Eff. rate">
              <span className="font-mono text-xs text-muted-foreground">
                {from.amount} {fromLabel} = {to.amount} {toLabel}
              </span>
            </DataRow>
          );
        })()
      : null;

  return (
    <div className="font-mono text-xs">
      {/* ── Core transfer data ────────────────────────────────────────────────── */}

      <DataRow label="Date">
        <span className="font-mono text-xs text-muted-foreground">
          {transfer.executedAt.format(MOMENT_DATETIME_VIEW_FORMAT)}
        </span>
      </DataRow>

      <DataRow label="Amount">
        <MoneyValue
          revert
          amount={transfer.amount}
          currency={senderCurrency}
          useColors={false}
          values={transfer.fromExpense.convertedValues}
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

      {transfer.note && (
        <DataRow label="Note">
          <span className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">{transfer.note}</span>
        </DataRow>
      )}

      <SectionDivider label="Summary" />

      <DataRow label="Sent">
        <MoneyValue
          revert
          amount={transfer.amount}
          currency={senderCurrency}
          useColors={false}
          values={transfer.fromExpense.convertedValues}
          className="font-mono text-xs"
        />
      </DataRow>

      <DataRow label="Received">
        <MoneyValue
          revert
          amount={stats.netReceived}
          currency={recipientCurrency}
          useColors={false}
          values={transfer.toIncome.convertedValues}
          className="font-mono text-xs"
        />
      </DataRow>

      {transfer.hasFee() && (
        <>
          <DataRow label="Fees">
            <span className="flex items-center gap-2">
              <MoneyValue
                amount={-stats.totalFeesInSenderCurr}
                currency={senderCurrency}
                useColors={false}
                className="font-mono text-xs text-destructive"
              />
              <span className="text-3xs text-destructive/75 font-mono">{stats.feePct.toFixed(2)}%</span>
            </span>
          </DataRow>

          <DataRow label="Total cost">
            <MoneyValue
              amount={stats.totalCost}
              currency={senderCurrency}
              useColors={false}
              className="font-mono text-xs font-semibold"
            />
          </DataRow>

          {effRateRow}
        </>
      )}

      {/* ── Transactions ──────────────────────────────────────────────────────── */}
      <SectionDivider label="Transactions" />

      <div className="space-y-1">
        <TransactionListItem flat revertValue transaction={transfer.fromExpense} />
        <TransactionListItem flat revertValue transaction={transfer.toIncome} />
      </div>

      {/* ── Fees ──────────────────────────────────────────────────────────────── */}
      {transfer.hasFee() && (
        <>
          <SectionDivider label={transfer.feeExpenses.length > 1 ? 'Fees' : 'Fee'} />

          <div className="space-y-1">
            {transfer.feeExpenses.map((feeTx) => (
              <TransactionListItem flat revertValue transaction={feeTx} key={feeTx.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Details;
