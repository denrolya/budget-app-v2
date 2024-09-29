import { InfoIcon } from 'lucide-react';
import React from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import MoneyValue from '@/components/common/MoneyValue';
import AccountBadge from '@/components/features/accounts/Badge';
import TransactionListItem from '@/components/features/transactions/ListItemV3';
import { Separator } from '@/components/ui/separator';
import Transfer from '@/models/Transfer';

interface TransferDetailsProps {
  transfer: Transfer;
}

export const Details: React.FC<TransferDetailsProps> = ({ transfer }) => {
  const fromCurrency = transfer.fromExpense.account.currency;
  const toCurrency = transfer.toIncome.account.currency;
  const rate = transfer.rate;


  const renderRate = () => {
    if ((fromCurrency === 'UAH' && toCurrency === 'USD') || (fromCurrency === 'USD' && toCurrency === 'UAH')) {
      return (
        <>
          <MoneyValue amount={1} currency={toCurrency} />
          {' = '}
          <MoneyValue amount={1/rate} currency={fromCurrency} />
        </>
      );
    } else if ((fromCurrency === 'UAH' && toCurrency === 'EUR') || (fromCurrency === 'EUR' && toCurrency === 'UAH')) {
      return (
        <>
          <MoneyValue amount={1} currency={toCurrency} />
          {' = '}
          <MoneyValue amount={1/rate} currency={fromCurrency} />
        </>
      );
    } else if ((fromCurrency === 'HUF' && toCurrency === 'UAH') || (fromCurrency === 'UAH' && toCurrency === 'HUF')) {
      return (
        <>
          <MoneyValue amount={1000} currency={fromCurrency} />
          {' = '}
          <MoneyValue amount={rate * 1000} currency={toCurrency} />
        </>
      );
    } else {
      return (
        <>
          <MoneyValue amount={1} currency={fromCurrency} />
          {' = '}
          <MoneyValue amount={rate} currency={toCurrency} />
        </>
      );
    }
  };

  const calculateFeePercentage = () => {
    if (transfer.hasFee()) {
      const feeAmount = transfer.feeExpense.amount;
      const transferAmount = transfer.amount;
      const feePercentage = (feeAmount / transferAmount) * 100;
      return feePercentage.toFixed(2);
    }
    return null;
  };

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Date</span>
            <RelativeDatetimeDisplay date={transfer.executedAt} className="font-medium" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Amount</span>
            <span className="font-medium font-mono">
              <MoneyValue amount={transfer.amount} currency={transfer.fromExpense.account.currency} />
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">From</span>
            <span className="font-medium"><AccountBadge account={transfer.fromExpense.account} size="md" /></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">To</span>
            <span className="font-medium"><AccountBadge account={transfer.toIncome.account} size="md" /></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Rate</span>
            <span className="font-medium font-mono">
              {renderRate()}
            </span>
          </div>
        </div>
        <Separator />
        <div className="grid gap-2">
          <h3 className="font-semibold">Related Transactions</h3>
          <div className="flex justify-between items-center">
            <span className="text-sm">Sender</span>
            <span className="font-medium text-destructive font-mono">
            - <MoneyValue amount={transfer.fromExpense.amount} currency={transfer.fromExpense.account.currency} />
          </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Recipient</span>
            <span className="font-medium text-success font-mono">
            + <MoneyValue amount={transfer.toIncome.amount} currency={transfer.toIncome.account.currency} />
          </span>
          </div>
        </div>
        <TransactionListItem transaction={transfer.fromExpense} />
        <TransactionListItem transaction={transfer.toIncome} />
        {transfer.hasFee() && (
          <>
            <Separator />
            <div className="grid gap-2">
              <h3 className="font-semibold">Fees</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm">Transfer Fee</span>
                <span className="font-medium font-mono">
                  <MoneyValue amount={transfer.feeExpense.amount} currency={transfer.feeExpense.account.currency} />
                  <span className="text-sm text-muted-foreground ml-2">
                    ({calculateFeePercentage()}%)
                  </span>
                </span>
              </div>
            </div>
            <TransactionListItem transaction={transfer.feeExpense} />
          </>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <InfoIcon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Transfer completed successfully
        </p>
      </div>
    </>
  );
};

export default Details;
