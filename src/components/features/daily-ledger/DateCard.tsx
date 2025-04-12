import { CalendarX } from 'lucide-react';
import { Moment } from 'moment';
import React from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import TransactionListItem, {
  ListItemSkeleton as TransactionListItemSkeleton,
} from '@/components/features/transactions/ListItemV3';
import TransferListItem, {
  ListItemSkeleton as TransferListItemSkeleton,
} from '@/components/features/transfers/ListItem';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
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
  const transactions = items.filter((item) => item instanceof Transaction) as Transaction[];
  const transfers = items.filter((item) => item instanceof Transfer) as Transfer[];
  const transactionsCount = transactions.length;
  const transfersCount = transfers.length;

  const { totalIncome, totalExpense } = transactions.reduce(
    (acc, transaction) => {
      if (transaction.isIncome()) {
        acc.totalIncome += transaction.convertedValues[baseCurrency];
      } else {
        acc.totalExpense += transaction.convertedValues[baseCurrency];
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 },
  );

  const netAmount = totalIncome - totalExpense;

  const transferAmount = transfers.reduce(
    (total, transfer) => total + transfer.fromExpense.convertedValues[baseCurrency],
    0,
  );

  const content = (
    <>
      <div className="flex flex-col space-y-2 pb-3 border-b border-border">
        <h4 className="text-lg font-semibold flex items-center">
          <RelativeDatetimeDisplay showDayBadge badgeSize="sm" variant="default" showTime={false} date={date} />
        </h4>
        <div className="flex flex-wrap gap-2 text-sm">
          <SummaryBadge icon={ROUTES.TRANSACTION_LIST.icon} count={transactionsCount} value={netAmount} />
          <SummaryBadge icon={ROUTES.TRANSFER_LIST.icon} count={transfersCount} value={transferAmount} />
        </div>
      </div>
      <div className="flex-grow overflow-auto max-w-full pt-3">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <CalendarX className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-medium text-foreground mb-1">No entries for today</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              There are no financial activities recorded for this date.
            </p>
          </div>
        )}
        {items.length > 0 && (
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
      className={cn(
        'flex flex-col w-full md:w-[calc(100%/2)] lg:w-[calc(100%/3)] xl:w-[calc(100%/4)] max-h-[calc(100vh-2rem)]',
        {
          'order-first md:order-last': index === 0,
          'order-last md:order-first': index === totalDays - 1,
        },
      )}
    >
      <div className="md:hidden w-full h-full max-h-full bg-background rounded-lg shadow-sm flex flex-col min-w-[300px]">
        <div className="p-0 md:p-4 flex-grow overflow-y-auto">{content}</div>
      </div>

      <Card className="hidden md:flex md:flex-col h-full max-h-full transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 overflow-hidden min-w-[470px]">
        <CardHeader className="pb-2 flex flex-col h-full overflow-hidden">
          <div className="flex-grow overflow-y-auto">{content}</div>
        </CardHeader>
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
      <div className="md:hidden w-full bg-background rounded-lg shadow-sm">{content}</div>

      <Card className="hidden md:flex md:flex-col transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25">
        <CardHeader className="pb-2">{content}</CardHeader>
      </Card>
    </div>
  );
});

DateCardSkeleton.displayName = 'DailyLedgerDateCardSkeleton';

export default DateCard;
