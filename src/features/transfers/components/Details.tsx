// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { InfoIcon } from 'lucide-react';
import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Separator } from '@/components/ui/separator';
import Transfer from '@/features/transfers/models/Transfer';
import AccountPill from '@/features/accounts/components/Pill';
import TransactionListItem from '@/features/transactions/components/ListItemV3';
import RateDisplay from '@/features/transfers/components/RateDisplay';

interface TransferDetailsProps {
  transfer: Transfer;
}

export const Details: React.FC<TransferDetailsProps> = ({ transfer }) => {
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
    <div className="w-full border-t">
      <div className="flex flex-col space-y-4 py-4">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="tracking-tight font-normal">Amount</span>
            <MoneyValue
              amount={transfer.amount}
              currency={transfer.fromExpense.account.currency}
              useColors={false}
              className="text-xs font-mono text-muted-foreground"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="tracking-tight font-normal">From</span>
            <AccountPill account={transfer.fromExpense.account} size="sm" variant="inline" />
          </div>
          <div className="flex justify-between items-center">
            <span className="tracking-tight font-normal">To</span>
            <AccountPill account={transfer.toIncome.account} size="sm" variant="inline" />
          </div>
          <div className="flex justify-between items-center">
            <span className="tracking-tight font-normal">Rate</span>
            <RateDisplay
              useSymbol
              transfer={transfer}
              className="text-xs font-mono tracking-tighter text-muted-foreground"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="tracking-tight font-normal">Date</span>
            <RelativeDatetimeDisplay
              date={transfer.executedAt}
              showDayBadge={false}
              showRelative={false}
              variant="default"
              className="text-xs font-mono tracking-tighter text-muted-foreground"
            />
          </div>
        </div>
        <Separator />
        <section>
          <h3 className="tracking-tight text-lg font-semibold mb-2">Related Transactions</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="tracking-tight font-normal">Sender</span>
              <span className="text-xs font-mono">
                {transfer?.feeExpense?.account.id === transfer.fromExpense.account.id ? (
                  <MoneyValue
                    showSign
                    amount={-(transfer.fromExpense.amount + transfer.feeExpense.amount)}
                    currency={transfer.fromExpense.account.currency}
                  />
                ) : (
                  <MoneyValue amount={-transfer.fromExpense.amount} currency={transfer.fromExpense.account.currency} />
                )}
              </span>
            </div>
            <TransactionListItem transaction={transfer.fromExpense} />
          </div>

          <div className="flex flex-col gap-2 mt-3">
            <div className="flex justify-between items-center">
              <span className="tracking-tight font-normal">Recipient</span>
              <span className="text-xs font-mono">
                {transfer?.feeExpense?.account.id === transfer.toIncome.account.id ? (
                  <MoneyValue
                    showSign
                    amount={transfer.feeExpense.amount + transfer.toIncome.amount}
                    currency={transfer.feeExpense.account.currency}
                  />
                ) : (
                  <MoneyValue amount={transfer.toIncome.amount} currency={transfer.toIncome.account.currency} />
                )}
              </span>
            </div>
            <TransactionListItem transaction={transfer.toIncome} />
          </div>
        </section>
        {transfer.hasFee() && (
          <>
            <Separator />
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold">Fees</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm">Transfer Fee</span>
                <span className="font-medium font-mono">
                  <MoneyValue
                    showSign
                    amount={-transfer.feeExpense.amount}
                    currency={transfer.feeExpense.account.currency}
                  />
                  <span className="text-sm text-destructive opacity-75 ml-2">({calculateFeePercentage()}%)</span>
                </span>
              </div>
            </div>
            <TransactionListItem transaction={transfer.feeExpense} />
          </>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <InfoIcon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Transfer completed successfully</p>
      </div>
    </div>
  );
};

export default Details;
