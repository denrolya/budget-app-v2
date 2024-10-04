import { ArrowRightLeftIcon, CalendarIcon, CalendarX, Receipt } from 'lucide-react';
import { Moment } from 'moment';
import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import TransactionListItem, {
  ListItemSkeleton as TransactionListItemSkeleton,
} from '@/components/features/transactions/ListItemV3';
import TransferListItem, {
  ListItemSkeleton as TransferListItemSkeleton,
} from '@/components/features/transfers/ListItem';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBaseCurrency } from '@/contexts/auth';
import { cn } from '@/lib/utils';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';

interface Props {
  date: Moment;
  items: (Transaction | Transfer)[];
  index: number;
  totalDays: number;
}

export const DateCard: React.FC<Props> = ({ date, items, index, totalDays }) => {
  const baseCurrency = useBaseCurrency();
  const transactions = items.filter(item => item instanceof Transaction) as Transaction[];
  const transfers = items.filter(item => item instanceof Transfer) as Transfer[];
  const transactionCount = transactions.length;
  const transferCount = transfers.length;

  const { totalIncome, totalExpense } = transactions.reduce((acc, transaction) => {
    if (transaction.isIncome()) {
      acc.totalIncome += transaction.convertedValues[baseCurrency];
    } else {
      acc.totalExpense += transaction.convertedValues[baseCurrency];
    }
    return acc;
  }, { totalIncome: 0, totalExpense: 0 });

  const netAmount = totalIncome - totalExpense;

  const transferAmount = transfers.reduce((total, transfer) =>
    total + transfer.fromExpense.convertedValues[baseCurrency], 0);

  const content = (
    <>
      <div className="flex flex-col space-y-2 pb-3 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{date.format('dddd, D MMM')}</span>
        </h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center min-w-[120px]">
            <ArrowRightLeftIcon className="mr-1 h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-medium mr-1">{transferCount}</span>
            <span className="text-muted-foreground truncate">
              (<MoneyValue useColors={false} amount={transferAmount} />)
            </span>
          </div>
          <div className="flex items-center min-w-[120px]">
            <Receipt className="mr-1 h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-medium mr-1">{transactionCount}</span>
            <span className="text-muted-foreground truncate">
              (<MoneyValue amount={netAmount} />)
            </span>
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-auto max-w-full pt-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <CalendarX className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-medium text-foreground mb-1">No entries for today</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              There are no financial activities recorded for this date.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
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
        )}
      </div>
    </>
  );

  return (
    <div
      className={cn('flex flex-col w-full', {
        'order-first md:order-last': index === 0,
        'order-last md:order-first': index === totalDays - 1,
      })}
    >
      <div className="md:hidden w-full bg-background p-4 rounded-lg shadow-sm">{content}</div>

      <Card className="hidden md:flex md:flex-col transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25">
        <CardHeader className="pb-2">{content}</CardHeader>
      </Card>
    </div>
  );
};

DateCard.displayName = 'DailyLedgerDateCard';

export const DateCardSkeleton: React.FC<{ index: number; totalDays: number }> = React.memo(({ index, totalDays }) => {
  const content = (
    <>
      <div className="flex flex-col space-y-2 pb-3 border-b border-border">
        <div className="flex items-center">
          <Skeleton className="mr-2 h-5 w-5 flex-shrink-0" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center min-w-[120px]">
            <Skeleton className="mr-1 h-4 w-4 flex-shrink-0" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center min-w-[120px]">
            <Skeleton className="mr-1 h-4 w-4 flex-shrink-0" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-auto max-w-full pt-3">
        <ul className="space-y-3">
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
      className={cn('flex flex-col w-full', {
        'order-first md:order-last': index === 0,
        'order-last md:order-first': index === totalDays - 1,
      })}
    >
      <div className="md:hidden w-full bg-background p-4 rounded-lg shadow-sm">{content}</div>

      <Card className="hidden md:flex md:flex-col transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25">
        <CardHeader className="pb-2">{content}</CardHeader>
      </Card>
    </div>
  );
});

DateCardSkeleton.displayName = 'DailyLedgerDateCardSkeleton';

export default DateCard;
