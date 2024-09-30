import { Moment } from 'moment';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import MoneyValue from '@/components/common/MoneyValue';
import TransactionListItem, {
  ListItemSkeleton as TransactionListItemSkeleton,
} from '@/components/features/transactions/ListItemV3';
import TransferListItem, {
  ListItemSkeleton as TransferListItemSkeleton,
} from '@/components/features/transfers/ListItem';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useBaseCurrency } from '@/contexts/auth';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';

interface Props {
  date: Moment
  items: (Transaction | Transfer)[]
  index: number
  totalDays: number
}

const DateCard: React.FC<Props> = ({ date, items, index, totalDays }) => {
  const baseCurrency = useBaseCurrency();
  const transactionCount = items.filter(item => item instanceof Transaction).length;
  const transferCount = items.filter(item => item instanceof Transfer).length;
  const { totalIncome, totalExpense } = items
    .filter(item => item instanceof Transaction)
    .reduce((acc, item) => {
      const transaction = item as Transaction;
      if (transaction.isIncome()) {
        acc.totalIncome += transaction.convertedValues[baseCurrency];
      } else {
        acc.totalExpense += transaction.convertedValues[baseCurrency];
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });
  const netAmount = totalIncome - totalExpense;

  const getNetAmountColor = (amount: number) => {
    if (amount > 0) return 'text-success';
    if (amount < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const content = (
    <>
      <div className="flex flex-col items-start justify-between space-y-1 pb-2">
        <h2 className="text-base font-semibold">{date.format('ddd, MMM D')}</h2>
        <div className="flex justify-between w-full text-xs">
          <span>{transactionCount + transferCount} items</span>
          <span className={getNetAmountColor(netAmount)}>
            <MoneyValue amount={netAmount} />
          </span>
        </div>
      </div>
      <div className="flex-grow overflow-auto max-w-full pt-2">
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="max-w-full">
                {item instanceof Transaction ? (
                  <TransactionListItem transaction={item} />
                ) : (
                  <TransferListItem transfer={item} />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground text-sm">No entries</p>
        )}
      </div>
    </>
  );

  return (
    <div
      className={cn('flex flex-col w-full mb-6 md:mb-0', {
        'order-first md:order-last': index === 0,
        'order-last md:order-first': index === totalDays - 1,
      })}
    >
      <div className="md:hidden w-full">{content}</div>

      <Card className="hidden md:flex md:flex-col">
        <CardHeader className="pb-2">{content}</CardHeader>
      </Card>
    </div>
  );
};

DateCard.displayName = 'DailyLedgerDateCard';

export const DateCardSkeleton: React.FC<{ index: number; totalDays: number }> = React.memo(({ index, totalDays }) => {
  const content = (
    <>
      <div className="flex flex-col items-start justify-between space-y-1 pb-2">
        <Skeleton className="h-6 w-32" />
        <div className="flex justify-between w-full">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="flex-grow overflow-auto max-w-full pt-2">
        <ul className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="max-w-full">
              {Math.random() > 0.5 ? <TransactionListItemSkeleton /> : <TransferListItemSkeleton />}
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <div
      className={cn('flex flex-col w-full mb-6 md:mb-0', {
        'order-first md:order-last': index === 0,
        'order-last md:order-first': index === totalDays - 1,
      })}
    >
      <div className="md:hidden w-full">{content}</div>

      <Card className="hidden md:flex md:flex-col">
        <CardHeader className="pb-2">{content}</CardHeader>
      </Card>
    </div>
  );
});

DateCardSkeleton.displayName = 'DailyLedgerDateCardSkeleton';

export default DateCard;
