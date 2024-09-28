import { Bitcoin, DollarSign, Edit, Euro, InfoIcon, Trash2 } from 'lucide-react';
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
import { useFixerExchangeRates, useMonobankExchangeRates } from '@/contexts/FinanceData';
import Transaction from '@/models/Transaction';

interface TransactionDetailsProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

const currencyOrder = [CURRENCY_CODE.EUR, CURRENCY_CODE.USD, CURRENCY_CODE.HUF, CURRENCY_CODE.UAH, CURRENCY_CODE.BTC];

const RateDisplay: React.FC<{
  value: number;
  source: string;
  from: CURRENCY_CODE;
  to: CURRENCY_CODE;
  amount: number;
  maximumFractionDigits: number
}> = ({ value, source, from, to, amount, maximumFractionDigits }) => (
  <div className="flex items-center space-x-2 text-sm">
    <MoneyValue amount={amount} currency={from} />
    <span className="text-muted-foreground">=</span>
    <div className="flex-1 flex items-start">
      <MoneyValue amount={amount * value} currency={to} maximumFractionDigits={maximumFractionDigits} />
      <sup className="ml-1 mt-2 text-[8px] font-medium text-muted-foreground">
        {source}
      </sup>
    </div>
  </div>
);

export const Details: React.FC<TransactionDetailsProps> = ({ transaction, onEdit, onDelete }) => {
  const isDebt = transaction.debt && transaction.debt.debtor;
  const currentRates = useFixerExchangeRates();
  const monobankRates = useMonobankExchangeRates();

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
      const rateBTCtoUSD = currentRates[CURRENCY_CODE.USD] / currentRates[CURRENCY_CODE.BTC];
      rate = rateBTCtoUSD;
      return `1 ${baseCurrencySymbol} = ${quoteCurrencySymbol}${rate.toFixed(2)}`;
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

  return (
    <>
      <div className="grid gap-4 py-4">
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
            <RelativeDatetimeDisplay date={transaction.executedAt} className="font-medium" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Category</span>
            <Badge variant="outline" className="text-xs px-1 py-0 whitespace-nowrap">{transaction.category.name}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Account</span>
            <span className="font-medium"><AccountBadge account={transaction.account} size="sm" /></span>
          </div>
          {isDebt && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Debtor</span>
              <span className="font-medium">{transaction.debt.debtor}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm">Amount</span>
            <span className="font-medium font-mono">
              <MoneyValue amount={transaction.amount} currency={transaction.account.currency} />
            </span>
          </div>
        </div>

        {transaction.note && (
          <>
            <Separator />
            <div className="grid gap-2">
              <h3 className="font-semibold">Note</h3>
              <p className="text-sm">{transaction.note}</p>
            </div>
          </>
        )}

        {transaction.convertedValues && Object.keys(transaction.convertedValues).length > 0 && (
          <>
            <Separator />
            <div className="grid gap-2">
              <h3 className="font-semibold">Converted Values</h3>
              <div className="space-y-2">
                {currencyOrder.map((currency) => {
                  const value = transaction.convertedValues[currency];
                  if (value === undefined) return null;
                  const exchangeRate = formatExchangeRate(value, currency);
                  if (!exchangeRate) return null;

                  return (
                    <>
                      <ResponsiveTooltip
                        openDelay={0}
                        desktopComponent="hovercard"
                        key={`transaction-${transaction.id}-converted-values-${currency}`}
                        content={
                          <div className="space-y-2">
                            <h4 className="font-semibold">Current {currency} Rates</h4>
                            <p className="text-sm text-muted-foreground">{exchangeRate}</p>
                            <div className="space-y-1">
                              <RateDisplay
                                value={currentRates[currency] / currentRates[transaction.account.currency]}
                                source="fx"
                                from={transaction.account.currency}
                                to={currency}
                                amount={transaction.amount}
                                maximumFractionDigits={2}
                              />
                              <RateDisplay
                                value={monobankRates[currency] / monobankRates[transaction.account.currency]}
                                source="mb"
                                from={transaction.account.currency}
                                to={currency}
                                amount={transaction.amount}
                                maximumFractionDigits={2}
                              />
                            </div>
                          </div>
                        }>
                        <div className="flex justify-between items-center cursor-help">
                          <span className="flex items-center space-x-2">
                            <CurrencyIcon currency={currency} />
                            <span>{currency}</span>
                          </span>
                          <MoneyValue className="font-medium text-sm" amount={value} currency={currency} />
                        </div>
                      </ResponsiveTooltip>
                    </>
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
              {transaction.compensations.map(comp => (
                comp && <TransactionListItem key={comp.id} transaction={comp} isCompensationView />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Transaction completed successfully
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit?.(transaction)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete?.(transaction)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </>
  );
};

export default Details;
