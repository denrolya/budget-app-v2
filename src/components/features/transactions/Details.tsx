import { ArrowDownIcon, ArrowUpIcon, Bitcoin, DollarSign, Edit, Euro, Trash2, User } from 'lucide-react';
import React, { useMemo } from 'react';

import { MOMENT_DATETIME_VIEW_FORMAT } from '@/constants/datetime';
import { MoneyValue } from '@/components/common/MoneyValue';
import { TransactionValue } from '@/components/common/TransactionValue';
import AccountAvatar from '@/components/features/accounts/Avatar';
import { ListItem as TransactionListItem } from '@/components/features/transactions/ListItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CURRENCIES } from '@/constants/currency';
import { useAccounts } from '@/contexts/FinanceData';
import Transaction from '@/models/Transaction';
import { useFixerExchangeRates } from '@/contexts/FinanceData';

interface TransactionDetailsProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

const currencyOrder = ['EUR', 'USD', 'HUF', 'UAH', 'BTC'];

export const Details: React.FC<TransactionDetailsProps> = ({ transaction, onEdit, onDelete }) => {
  const isIncome = transaction.type === 'income';
  const isDebt = transaction.debt && transaction.debt.debtor;
  const accounts = useAccounts();
  const account = useMemo(() => accounts.find(account => account.id === transaction.account.id), [accounts, transaction.account?.id]);
  const currentRates = useFixerExchangeRates();

  const formatExchangeRate = (convertedAmount: number, targetCurrency: string) => {
    const transactionCurrency = CURRENCIES[transaction.account.currency];
    const transactionAmount = transaction.amount;

    if (targetCurrency === transactionCurrency.code) {
      return null; // Don't show exchange rate for the transaction currency
    }

    let baseCurrencySymbol, quoteCurrencySymbol, rate;

    if (targetCurrency === 'BTC') {
      // Display how many EUR is one BTC
      baseCurrencySymbol = CURRENCIES['BTC'].symbol; // "₿"
      quoteCurrencySymbol = CURRENCIES['USD'].symbol; // "€"
      // Calculate the exchange rate using currentRates
      const rateBTCtoUSD = currentRates['USD'] / currentRates['BTC'];
      rate = rateBTCtoUSD;
      return `1 ${baseCurrencySymbol} = ${quoteCurrencySymbol}${rate.toFixed(2)}`;
    } else if (transactionCurrency.code === 'EUR' || transactionCurrency.code === 'USD') {
      // When transaction currency is EUR or USD
      baseCurrencySymbol = transactionCurrency.symbol;
      quoteCurrencySymbol = CURRENCIES[targetCurrency].symbol;
      rate = convertedAmount / transactionAmount;
      return `1 ${baseCurrencySymbol} = ${quoteCurrencySymbol}${rate.toFixed(2)}`;
    } else if (transactionCurrency.code === 'UAH' && targetCurrency === 'HUF') {
      // When transaction currency is UAH and target currency is HUF
      const rateFor1000HUF = (1000 * transactionAmount) / convertedAmount;
      baseCurrencySymbol = `1000 ${CURRENCIES[targetCurrency].symbol}`; // "1000 Ft"
      quoteCurrencySymbol = transactionCurrency.symbol; // "₴"
      rate = rateFor1000HUF;
      return `${baseCurrencySymbol} = ${quoteCurrencySymbol}${rate.toFixed(2)}`;
    } else {
      // Default case
      baseCurrencySymbol = CURRENCIES[targetCurrency].symbol;
      quoteCurrencySymbol = transactionCurrency.symbol;
      rate = transactionAmount / convertedAmount;
      return `1 ${baseCurrencySymbol} = ${quoteCurrencySymbol}${rate.toFixed(2)}`;
    }
  };

  const CurrencyIcon = ({ currency }: { currency: string }) => {
    switch (currency) {
      case 'EUR':
        return <Euro className="h-4 w-4" />;
      case 'USD':
        return <DollarSign className="h-4 w-4" />;
      case 'BTC':
        return <Bitcoin className="h-4 w-4" />;
      case 'HUF':
        return <span className="text-sm font-bold">Ft</span>;
      case 'UAH':
        return <span className="text-sm font-bold">₴</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span className="capitalize">{transaction.type} <code>#{transaction.id}</code></span>
              {transaction.isDraft && <Badge variant="outline">Draft</Badge>}
            </CardTitle>
            <Badge variant={isIncome ? 'default' : 'destructive'} className="text-lg">
              <TransactionValue transaction={transaction} />
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex align-center space-x-4">
              <AccountAvatar account={account} />
              <div>
                <p className="text-sm font-medium leading-none">{transaction.account.name}</p>
                <p className="text-sm text-muted-foreground">{transaction.account.currency}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit?.(transaction)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete?.(transaction)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`rounded-full p-1 ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
              {isIncome ? (
                <ArrowUpIcon className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{transaction.category.name}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.executedAt.format(MOMENT_DATETIME_VIEW_FORMAT)}
              </p>
            </div>
          </div>
          {isDebt && (
            <div className="flex items-center space-x-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">Debtor</p>
                <p className="text-sm text-muted-foreground">{transaction.debt.debtor}</p>
              </div>
            </div>
          )}
          {transaction.note && (
            <div>
              <p className="text-sm font-medium leading-none">Note</p>
              <p className="text-sm text-muted-foreground">{transaction.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {transaction.convertedValues && Object.keys(transaction.convertedValues).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Converted Values</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currencyOrder.map((currency) => {
                const value = transaction.convertedValues[currency];
                if (value === undefined) return null;
                const exchangeRate = formatExchangeRate(value, currency);
                if (!exchangeRate) return null;

                const currentValue = transaction.amount * currentRates[currency] / currentRates[transaction.account.currency];

                return (
                  <div key={currency} className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="flex flex-col justify-start">
                        <span className="flex flex-row items-center justify-start font-medium space-x-2">
                          <CurrencyIcon currency={currency} />
                          <span>{currency}</span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {exchangeRate}
                        </span>
                      </span>
                      <div className="flex flex-col items-end">
                        <MoneyValue amount={value} currency={currency} />
                        <span className="text-sm text-muted-foreground">
                          Now: <MoneyValue amount={currentValue} currency={currency} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {transaction.compensations && transaction.compensations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compensation Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transaction.compensations.map(comp => (
                comp && <TransactionListItem key={comp.id} transaction={comp} isCompensationView />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Details;
