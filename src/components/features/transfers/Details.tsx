import { InfoIcon } from 'lucide-react';
import React from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDispay';
import MoneyValue from '@/components/common/MoneyValue';
import AccountBadge from '@/components/features/accounts/Badge';
import TransactionListItem from '@/components/features/transactions/ListItemV2';
import { Separator } from '@/components/ui/separator';
import Transfer from '@/models/Transfer';

interface TransferDetailsProps {
  transfer: Transfer;
}

export const Details: React.FC<TransferDetailsProps> = ({ transfer }) => (
  <>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm">Date</span>
          <RelativeDatetimeDisplay date={transfer.executedAt} className="font-medium" />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Amount</span>
          <span className="font-medium font-mono"><MoneyValue amount={transfer.amount} /></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">From</span>
          <span className="font-medium"><AccountBadge account={transfer.fromExpense.account} size="sm" /></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">To</span>
          <span className="font-medium"><AccountBadge account={transfer.toIncome.account} size="sm" /></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Rate</span>
          <span className="font-medium font-mono">
            <MoneyValue amount={1} currency={transfer.fromExpense.account.currency} />
            {' = '}
            <MoneyValue amount={transfer.rate} currency={transfer.toIncome.account.currency} />
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

export default Details;
