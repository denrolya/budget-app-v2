import { Moment } from 'moment';
import React, { useMemo } from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import TransactionListItem, {
  ListItemSkeleton as TransactionListItemSkeleton,
} from '@/components/features/transactions/ListItemV3';
import TransferListItem, {
  ListItemSkeleton as TransferListItemSkeleton,
} from '@/components/features/transfers/ListItem';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useBaseCurrency } from '@/contexts/auth';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';

interface Props {
  date: Moment;
  items: (Transaction | Transfer)[];
  index: number;
  totalDays: number;
}

export const DateCard: React.FC<Props> = ({ date, items }) => {
  const baseCurrency = useBaseCurrency();

  const { transactions, transfers } = useMemo(() => {
    const t: Transaction[] = [];
    const tr: Transfer[] = [];
    items.forEach((it) => {
      if (it instanceof Transaction) t.push(it);
      else tr.push(it as Transfer);
    });
    return { transactions: t, transfers: tr };
  }, [items]);

  const transactionsCount = transactions.length;
  const transfersCount = transfers.length;

  const { netAmount, transferAmount } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      const v = tx.convertedValues?.[baseCurrency] ?? 0;
      if (tx.isIncome()) income += v;
      else expense += v;
    });

    let trAmount = 0;
    transfers.forEach((tr) => {
      trAmount += tr.fromExpense?.convertedValues?.[baseCurrency] ?? 0;
    });

    return { netAmount: income - expense, transferAmount: trAmount };
  }, [transactions, transfers, baseCurrency]);

  return (
    <Card className="h-full w-full overflow-hidden">
      <CardContent className="h-full p-0 flex flex-col">
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <h4 className="text-lg font-semibold">
            <RelativeDatetimeDisplay showDayBadge badgeSize="sm" date={date} showTime={false} variant="default" />
          </h4>

          <div className="flex flex-wrap gap-2 text-sm">
            <SummaryBadge count={transactionsCount} icon={ROUTES.TRANSACTION_LIST.icon} value={netAmount} />
            <SummaryBadge count={transfersCount} icon={ROUTES.TRANSFER_LIST.icon} value={transferAmount} />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {items.length > 0 && (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li className="max-w-full" key={item.id}>
                  {item instanceof Transaction && <TransactionListItem transaction={item} />}
                  {item instanceof Transfer && <TransferListItem transfer={item} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const DateCardSkeleton: React.FC<{ index: number; totalDays: number }> = React.memo(() => (
    <Card className="h-full w-full overflow-hidden">
      <CardContent className="h-full p-0 flex flex-col">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="mt-2 flex gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <ul className="flex flex-col gap-4">
            <li>{Math.random() > 0.5 ? <TransactionListItemSkeleton /> : <TransferListItemSkeleton />}</li>
            <li>{Math.random() > 0.5 ? <TransactionListItemSkeleton /> : <TransferListItemSkeleton />}</li>
            <li>{Math.random() > 0.5 ? <TransactionListItemSkeleton /> : <TransferListItemSkeleton />}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  ));

DateCard.displayName = 'DailyLedgerDateCard';
DateCardSkeleton.displayName = 'DailyLedgerDateCardSkeleton';

export default DateCard;
