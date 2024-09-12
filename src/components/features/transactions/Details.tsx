import React from 'react';
import { Euro, Bitcoin, DollarSign, ArrowDownIcon, ArrowUpIcon, CreditCard, User, Edit, Trash2, Copy, Share2 } from 'lucide-react';

import { CURRENCIES } from '@/constants/currency';
import { Transaction } from '@/models/transaction';
import { ListItem as TransactionListItem } from '@/components/features/transactions/ListItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MoneyValue } from '@/components/common/MoneyValue';
import { TransactionValue } from '@/components/common/TransactionValue';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TransactionDetailsProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onDuplicate?: (transaction: Transaction) => void;
  onShare?: (transaction: Transaction) => void;
}

const currencyOrder = ['EUR', 'USD', 'HUF', 'UAH', 'BTC'];

export const Details: React.FC<TransactionDetailsProps> = ({
                                                             transaction,
                                                             onEdit,
                                                             onDelete,
                                                             onDuplicate,
                                                             onShare
                                                           }) => {
  const isIncome = transaction.type === 'income';
  const isDebt = transaction.debt && transaction.debt.debtor;

  const formatExchangeRate = (convertedAmount: number, targetCurrency: string) => {
    const transactionCurrency = CURRENCIES[transaction.account.currency];
    const transactionAmount = transaction.amount;

    switch (targetCurrency) {
      case 'BTC':
        return `1 ₿ = ${transactionCurrency.symbol}${(transactionAmount / convertedAmount).toFixed(2)}`;
      case 'HUF':
        const rateFor1000HUF = (1000 * transactionAmount) / convertedAmount;
        return `1000 Ft = ${transactionCurrency.symbol}${rateFor1000HUF.toFixed(2)}`;
      case transactionCurrency.code:
        return null; // Don't show exchange rate for the transaction currency
      default:
        const rateForOneTargetCurrency = transactionAmount / convertedAmount;
        return `1 ${CURRENCIES[targetCurrency].symbol} = ${transactionCurrency.symbol}${rateForOneTargetCurrency.toFixed(2)}`;
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
              <span>{isIncome ? 'Income' : 'Expense'} <code>#{transaction.id}</code></span>
              {transaction.isDraft && <Badge variant="outline">Draft</Badge>}
            </CardTitle>
            <Badge variant={isIncome ? 'default' : 'destructive'} className="text-lg">
              <TransactionValue transaction={transaction} />
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">{transaction.account.name}</p>
                <p className="text-sm text-muted-foreground">{transaction.account.currency}</p>
              </div>
            </div>
            <TooltipProvider>
              <div className="flex space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(transaction)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onDelete?.(transaction)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onDuplicate?.(transaction)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onShare?.(transaction)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
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
                {transaction.executedAt.format('PPP p')}
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
                if (!exchangeRate) return null; // Skip displaying the transaction currency
                return (
                  <div key={currency} className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center space-x-2">
                        <CurrencyIcon currency={currency} />
                        <span>{currency}</span>
                      </span>
                      <MoneyValue amount={value} currency={currency} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {exchangeRate}
                    </p>
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
