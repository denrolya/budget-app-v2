import { Bitcoin, DollarSign, Edit, Euro, Loader2, Trash2 } from 'lucide-react';
import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Button } from '@/components/ui/button';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import AccountPill from '@/features/accounts/components/Pill';
import { useExchangeRates, useMonobankExchangeRates, useWiseExchangeRates } from '@/hooks/financeData';
import { confirm } from '@/lib/confirmation';
import { cn } from '@/lib/utils';

import { useMutations } from '../api/mutations';
import type Transaction from '../models/Transaction';
import { Type as TransactionType } from '../types';

import TransactionListItem from './ListItem';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransactionDetailsProps {
  transaction: Transaction;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCY_ORDER = [
  CURRENCY_CODE.EUR,
  CURRENCY_CODE.USD,
  CURRENCY_CODE.HUF,
  CURRENCY_CODE.UAH,
  CURRENCY_CODE.BTC,
];

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

/**
 * Currency icon used next to converted value rows.
 */
const CurrencyIcon: React.FC<{ currency: CURRENCY_CODE }> = ({ currency }) => {
  switch (currency) {
    case CURRENCY_CODE.EUR:
      return <Euro className="h-3 w-3" />;
    case CURRENCY_CODE.USD:
      return <DollarSign className="h-3 w-3" />;
    case CURRENCY_CODE.BTC:
      return <Bitcoin className="h-3 w-3" />;
    case CURRENCY_CODE.HUF:
      return <span className="text-3xs font-bold leading-none">Ft</span>;
    case CURRENCY_CODE.UAH:
      return <span className="text-3xs font-bold leading-none">₴</span>;
    default:
      return null;
  }
};

/**
 * One exchange rate line: `amount in source = amount in target  [source label]`
 */
const ExchangeRateLine: React.FC<{
  amount: number;
  sourceCurrency: CURRENCY_CODE;
  targetCurrency: CURRENCY_CODE;
  rate: number;
  decimals: number;
  sourceLabel: string;
}> = ({ amount, sourceCurrency, targetCurrency, rate, decimals, sourceLabel }) => (
  <div className="flex items-center gap-2 font-mono text-2xs">
    <MoneyValue amount={amount} currency={sourceCurrency} useColors={false} className="tabular-nums" />
    <span className="text-muted-foreground">=</span>
    <MoneyValue
      amount={amount * rate}
      currency={targetCurrency}
      maximumFractionDigits={decimals}
      useColors={false}
      className="tabular-nums"
    />
    <span className="text-muted-foreground/60 text-3xs">{sourceLabel}</span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Details: React.FC<TransactionDetailsProps> = ({ transaction }) => {
  const { openForm } = useFormContext();
  const { delete: deleteTransaction, isDeleting, isUpdating: isEditing } = useMutations();

  const isDebt = transaction.debt && transaction.debt.debtor;
  const fixerRates = useExchangeRates().fixer;
  const monobankRates = useMonobankExchangeRates();
  const wiseRates = useWiseExchangeRates();

  const hasConvertedValues =
    transaction.convertedValues && Object.keys(transaction.convertedValues).length > 0;
  const hasCompensations = transaction.compensations && transaction.compensations.length > 0;

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Are you absolutely sure?',
      description: `You are about to delete ${transaction.type} transaction #${transaction.id} (${transaction.account.currency} ${transaction.amount}). This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      deleteTransaction(transaction.id);
    }
  };

  const formatExchangeRate = (convertedAmount: number, targetCurrency: CURRENCY_CODE): string | null => {
    const transactionCurrency = CURRENCIES[transaction.account.currency];
    const transactionAmount = transaction.amount;

    if (targetCurrency === transactionCurrency.code) return null;

    if (targetCurrency === CURRENCY_CODE.BTC) {
      const rateInUsdPerBtc = fixerRates[CURRENCY_CODE.USD] / fixerRates[CURRENCY_CODE.BTC];
      return `1 ${CURRENCIES[CURRENCY_CODE.BTC].symbol} = ${CURRENCIES[CURRENCY_CODE.USD].symbol}${rateInUsdPerBtc.toFixed(8)}`;
    }

    if (transactionCurrency.code === CURRENCY_CODE.EUR || transactionCurrency.code === CURRENCY_CODE.USD) {
      const rate = convertedAmount / transactionAmount;
      return `1 ${transactionCurrency.symbol} = ${CURRENCIES[targetCurrency].symbol}${rate.toFixed(2)}`;
    }

    if (transactionCurrency.code === CURRENCY_CODE.UAH && targetCurrency === CURRENCY_CODE.HUF) {
      const rateFor1000Huf = (1000 * transactionAmount) / convertedAmount;
      return `1000 ${CURRENCIES[targetCurrency].symbol} = ${transactionCurrency.symbol}${rateFor1000Huf.toFixed(2)}`;
    }

    const rate = transactionAmount / convertedAmount;
    return `1 ${CURRENCIES[targetCurrency].symbol} = ${transactionCurrency.symbol}${rate.toFixed(2)}`;
  };

  return (
    <div className="font-mono text-xs">
      {/* ── Core data ─────────────────────────────────────────────────────────── */}

      {/* Type + draft status */}
      <DataRow label="Type">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-semibold uppercase tracking-wider border',
              transaction.type === TransactionType.Income
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-destructive/10 text-destructive border-destructive/20',
            )}
          >
            {transaction.type}
          </span>
          {transaction.isDraft && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-semibold uppercase tracking-wider border bg-warning/10 text-warning-foreground border-warning/20">
              Draft
            </span>
          )}
        </div>
      </DataRow>

      <DataRow label="Amount">
        <MoneyValue
          amount={transaction.amount * (transaction.isExpense() ? -1 : 1)}
          currency={transaction.account.currency}
          showValuesTooltip={false}
          className="font-mono text-sm font-semibold"
        />
      </DataRow>

      <DataRow label="Account">
        <AccountPill account={transaction.account} size="sm" />
      </DataRow>

      <DataRow label="Date">
        <RelativeDatetimeDisplay
          date={transaction.executedAt}
          showDayBadge={false}
          showRelative={false}
          variant="default"
          className="font-mono text-xs text-muted-foreground"
        />
      </DataRow>

      <DataRow label="Category">
        <div className="space-y-0.5">
          <span className="inline-flex items-center px-1 py-0 rounded border border-border text-xs bg-background">
            {transaction.category.name}
          </span>
          <p className="text-3xs text-muted-foreground tracking-tight">
            {transaction.category.getFullPath().join(' › ')}
          </p>
        </div>
      </DataRow>

      {isDebt && (
        <DataRow label="Debtor">
          <span className="text-xs">{transaction.debt?.debtor}</span>
        </DataRow>
      )}

      {/* ── Note ──────────────────────────────────────────────────────────────── */}
      {transaction.note && (
        <>
          <SectionDivider label="Note" />
          <p className="text-xs text-muted-foreground leading-relaxed">{transaction.note}</p>
        </>
      )}

      {/* ── Converted values ──────────────────────────────────────────────────── */}
      {hasConvertedValues && (
        <>
          <SectionDivider label="Exchange Values (At Time of Transaction)" />

          <div className="space-y-1">
            {CURRENCY_ORDER.map((targetCurrency) => {
              const convertedAmount = transaction.convertedValues[targetCurrency];
              if (convertedAmount === undefined) return null;

              const rateLabel = formatExchangeRate(convertedAmount, targetCurrency);
              if (!rateLabel) return null;

              const isBtc = targetCurrency === CURRENCY_CODE.BTC;
              const decimals = isBtc ? 8 : 2;

              const historicalRate = convertedAmount / transaction.amount;
              const fixerRate = fixerRates[targetCurrency] / fixerRates[transaction.account.currency];
              const monobankRate = monobankRates[targetCurrency] / monobankRates[transaction.account.currency];
              const wiseRate = wiseRates[targetCurrency] / wiseRates[transaction.account.currency];

              return (
                <ResponsiveTooltip
                  key={`transaction-${transaction.id}-converted-${targetCurrency}`}
                  desktopComponent="hovercard"
                  openDelay={0}
                  content={
                    <div className="space-y-3 font-mono text-xs">
                      <div>
                        <p className="text-3xs uppercase tracking-widest text-muted-foreground mb-1">
                          Historical Rate — {transaction.executedAt.format(BACKEND_DATE_FORMAT)}
                        </p>
                        <ExchangeRateLine
                          amount={transaction.amount}
                          decimals={decimals}
                          rate={historicalRate}
                          sourceLabel="hist"
                          sourceCurrency={transaction.account.currency as CURRENCY_CODE}
                          targetCurrency={targetCurrency}
                        />
                      </div>
                      <div>
                        <p className="text-3xs uppercase tracking-widest text-muted-foreground mb-1">Current Rates</p>
                        <div className="space-y-0.5">
                          <ExchangeRateLine
                            amount={transaction.amount}
                            decimals={decimals}
                            rate={fixerRate}
                            sourceLabel="Fixer"
                            sourceCurrency={transaction.account.currency as CURRENCY_CODE}
                            targetCurrency={targetCurrency}
                          />
                          <ExchangeRateLine
                            amount={transaction.amount}
                            decimals={decimals}
                            rate={monobankRate}
                            sourceLabel="Monobank"
                            sourceCurrency={transaction.account.currency as CURRENCY_CODE}
                            targetCurrency={targetCurrency}
                          />
                          <ExchangeRateLine
                            amount={transaction.amount}
                            decimals={decimals}
                            rate={wiseRate}
                            sourceLabel="Wise"
                            sourceCurrency={transaction.account.currency as CURRENCY_CODE}
                            targetCurrency={targetCurrency}
                          />
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className="flex items-center justify-between gap-3 py-0.5 cursor-help group">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CurrencyIcon currency={targetCurrency} />
                      <span className="text-3xs uppercase tracking-wider">{targetCurrency}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MoneyValue
                        amount={convertedAmount}
                        currency={targetCurrency}
                        maximumFractionDigits={decimals}
                        useColors={false}
                        className="font-mono text-xs tabular-nums text-muted-foreground"
                      />
                      <span className="text-3xs text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                        {rateLabel}
                      </span>
                    </div>
                  </div>
                </ResponsiveTooltip>
              );
            })}
          </div>
        </>
      )}

      {/* ── Compensation transactions ──────────────────────────────────────────── */}
      {hasCompensations && (
        <>
          <SectionDivider label="Compensation Transactions" />
          <div className="space-y-1">
            {transaction.compensations!.map((compensation) => (
              <TransactionListItem isCompensationView flat transaction={compensation} key={compensation.id} />
            ))}
          </div>
        </>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
        <Button
          disabled={isEditing || isDeleting}
          size="sm"
          variant="outline"
          onClick={() => openForm(FormType.Transaction, transaction)}
        >
          {isEditing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating…
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>

        <Button
          disabled={isEditing || isDeleting}
          size="sm"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleDelete}
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting…
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Details;
