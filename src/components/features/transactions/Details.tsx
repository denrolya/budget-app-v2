import { Bitcoin, DollarSign, Edit, Euro, InfoIcon, Loader2, Trash2 } from 'lucide-react';
import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import TransactionValue from '@/components/common/TransactionValue';
import AccountBadge from '@/components/features/accounts/Badge';
import { ListItem as TransactionListItem } from '@/components/features/transactions/ListItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Separator } from '@/components/ui/separator';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useFixerExchangeRates, useMonobankExchangeRates, useWiseExchangeRates } from '@/contexts/FinanceData';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactionMutations } from '@/hooks/useTransactionMutations';
import Transaction from '@/models/Transaction';
import { confirm } from '@/utils/confirmation';

interface TransactionDetailsProps {
  transaction: Transaction;
  onEdit?: () => void;
}

const currencyOrder = [CURRENCY_CODE.EUR, CURRENCY_CODE.USD, CURRENCY_CODE.HUF, CURRENCY_CODE.UAH, CURRENCY_CODE.BTC];

const RateDisplay: React.FC<{
  value: number;
  source: string;
  from: CURRENCY_CODE;
  to: CURRENCY_CODE;
  amount: number;
  decimals: number;
}> = ({ value, source, from, to, amount, decimals }) => (
  <div className="flex items-center space-x-2 text-xs font-mono">
    <MoneyValue useColors={false} amount={amount} currency={from} />
    <span className="text-muted-foreground">=</span>
    <div className="flex-1 flex items-start">
      <MoneyValue
        useColors={false}
        className="font-mono"
        amount={amount * value}
        currency={to}
        maximumFractionDigits={decimals}
      />
      <sup className="ml-1 mt-2 text-[8px] font-medium text-muted-foreground">{source}</sup>
    </div>
  </div>
);

export const Details: React.FC<TransactionDetailsProps> = ({ transaction }) => {
  const { openForm } = useFormContext();
  const { deleteTransaction, isDeleting, isUpdating: isEditing } = useTransactionMutations();

  const isDebt = transaction.debt && transaction.debt.debtor;
  const fixerRates = useFixerExchangeRates();
  const monobankRates = useMonobankExchangeRates();
  const wiseRates = useWiseExchangeRates();

  const formatExchangeRate = (convertedAmount: number, targetCurrency: CURRENCY_CODE) => {
    const transactionCurrency = CURRENCIES[transaction.account.currency];
    const transactionAmount = transaction.amount;

    if (targetCurrency === transactionCurrency.code) {
      return null;
    }

    let baseCurrencySymbol, quoteCurrencySymbol, rate;

    if (targetCurrency === CURRENCY_CODE.BTC) {
      baseCurrencySymbol = CURRENCIES[CURRENCY_CODE.BTC].symbol;
      quoteCurrencySymbol = CURRENCIES[CURRENCY_CODE.USD].symbol;
      const rateBTCtoUSD = fixerRates[CURRENCY_CODE.USD] / fixerRates[CURRENCY_CODE.BTC];
      rate = rateBTCtoUSD;
      return `1 ${baseCurrencySymbol} = ${quoteCurrencySymbol}${rate.toFixed(8)}`;
    } else if (transactionCurrency.code === CURRENCY_CODE.EUR || transactionCurrency.code === CURRENCY_CODE.USD) {
      baseCurrencySymbol = transactionCurrency.symbol;
      quoteCurrencySymbol = CURRENCIES[targetCurrency].symbol;
      rate = convertedAmount / transactionAmount;
      return `1 ${baseCurrencySymbol} = ${quoteCurrencySymbol}${rate.toFixed(2)}`;
    } else if (transactionCurrency.code === CURRENCY_CODE.UAH && targetCurrency === CURRENCY_CODE.HUF) {
      const rateFor1000HUF = (1000 * transactionAmount) / convertedAmount;
      baseCurrencySymbol = `1000 ${CURRENCIES[targetCurrency].symbol}`;
      quoteCurrencySymbol = transactionCurrency.symbol;
      rate = rateFor1000HUF;
      return `${baseCurrencySymbol} = ${quoteCurrencySymbol}${rate.toFixed(2)}`;
    } else {
      baseCurrencySymbol = CURRENCIES[targetCurrency].symbol;
      quoteCurrencySymbol = transactionCurrency.symbol;
      rate = transactionAmount / convertedAmount;
      return `1 ${baseCurrencySymbol} = ${quoteCurrencySymbol}${rate.toFixed(2)}`;
    }
  };

  const CurrencyIcon = ({ currency }: { currency: string }) => {
    switch (currency) {
      case CURRENCY_CODE.EUR:
        return <Euro className="h-4 w-4" />;
      case CURRENCY_CODE.USD:
        return <DollarSign className="h-4 w-4" />;
      case CURRENCY_CODE.BTC:
        return <Bitcoin className="h-4 w-4" />;
      case CURRENCY_CODE.HUF:
        return <span className="text-sm font-bold">Ft</span>;
      case CURRENCY_CODE.UAH:
        return <span className="text-sm font-bold">₴</span>;
      default:
        return null;
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    const confirmed = await confirm({
      title: 'Are you absolutely sure?',
      description: `You are about to delete ${transaction.type} transaction #${transaction.id}(${transaction.account.currency}${transaction.amount}). This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      deleteTransaction(transaction.id);
    }
  };

  return (
    <>
      <div className="grid gap-4">
        <div className="flex justify-between">
          <span className="capitalize">
            {transaction.type} <code>#{transaction.id}</code>
            {transaction.isDraft && <Badge variant="outline">Draft</Badge>}
          </span>
          <TransactionValue badge transaction={transaction} />
        </div>
        <div className="grid gap-2">
          <h3 className="font-semibold">Transaction Data</h3>
          <div className="flex justify-between items-center">
            <span className="text-sm">Date</span>
            <RelativeDatetimeDisplay
              showRelative
              showDayBadge
              badgeSize="sm"
              variant="default"
              date={transaction.executedAt}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Category</span>
            <div className="flex flex-col items-end">
              <Badge variant="outline" className="text-xs px-1 py-0 whitespace-nowrap mb-1">
                {transaction.category.name}
              </Badge>
              <span className="text-xs text-muted-foreground">{transaction.category.getFullPath().join(' > ')}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Account</span>
            <span className="font-medium">
              <AccountBadge size="md" account={transaction.account} />
            </span>
          </div>
          {isDebt && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Debtor</span>
              <span className="font-medium">{transaction.debt?.debtor}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm">Amount</span>
            <span className="font-medium font-mono">
              <MoneyValue useColors={false} amount={transaction.amount} currency={transaction.account.currency} />
            </span>
          </div>
        </div>

        {transaction.note && (
          <>
            <Separator />
            <div className="flex items-center space-x-2">
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{transaction.note}</p>
            </div>
          </>
        )}

        {transaction.convertedValues && Object.keys(transaction.convertedValues).length > 0 && (
          <>
            <Separator />
            <div className="grid gap-2">
              <h3 className="font-semibold">Converted Values (At Time of Transaction)</h3>
              <div className="space-y-2">
                {currencyOrder.map((currency) => {
                  const value = transaction.convertedValues[currency];
                  if (value === undefined) return null;
                  const exchangeRate = formatExchangeRate(value, currency);
                  if (!exchangeRate) return null;
                  const isBTC = currency === CURRENCY_CODE.BTC;

                  return (
                    <ResponsiveTooltip
                      openDelay={0}
                      desktopComponent="hovercard"
                      key={`transaction-${transaction.id}-converted-values-${currency}`}
                      content={
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold">Historical Rate</h4>
                            <p className="text-sm text-muted-foreground">
                              {transaction.executedAt.format('DD-MM-YYYY')}
                            </p>
                            <RateDisplay
                              value={value / transaction.amount}
                              source="hist"
                              from={transaction.account.currency}
                              to={currency}
                              amount={transaction.amount}
                              decimals={isBTC ? 8 : 2}
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold">Current Rates</h4>
                            <div className="space-y-1">
                              <RateDisplay
                                value={fixerRates[currency] / fixerRates[transaction.account.currency]}
                                source="fx"
                                from={transaction.account.currency}
                                to={currency}
                                amount={transaction.amount}
                                decimals={isBTC ? 8 : 2}
                              />
                              <RateDisplay
                                value={monobankRates[currency] / monobankRates[transaction.account.currency]}
                                source="mn"
                                from={transaction.account.currency}
                                to={currency}
                                amount={transaction.amount}
                                decimals={isBTC ? 8 : 2}
                              />
                              <RateDisplay
                                value={wiseRates[currency] / wiseRates[transaction.account.currency]}
                                source="ws"
                                from={transaction.account.currency}
                                to={currency}
                                amount={transaction.amount}
                                decimals={isBTC ? 8 : 2}
                              />
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <div className="flex justify-between items-center cursor-help">
                        <span className="flex items-center space-x-2">
                          <CurrencyIcon currency={currency} />
                          <span>{currency}</span>
                        </span>
                        <MoneyValue
                          useColors={false}
                          className="font-medium font-mono"
                          amount={value}
                          currency={currency}
                          maximumFractionDigits={isBTC ? 8 : 2}
                        />
                      </div>
                    </ResponsiveTooltip>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {transaction.compensations && transaction.compensations.length > 0 && (
          <>
            <Separator />
            <div className="grid gap-2">
              <h3 className="font-semibold">Compensation Transactions</h3>
              {transaction.compensations.map((comp) => (
                <TransactionListItem isCompensationView key={comp.id} transaction={comp} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-end mt-6">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isEditing || isDeleting}
            onClick={() => openForm(FormType.Transaction, transaction)}
          >
            {isEditing && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            )}
            {!isEditing && (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            disabled={isEditing || isDeleting}
            onClick={() => handleDelete(transaction)}
          >
            {isDeleting && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            )}
            {!isDeleting && (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default Details;
