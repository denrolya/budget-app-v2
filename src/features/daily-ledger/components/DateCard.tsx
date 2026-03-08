import { Moment } from 'moment';
import React, { useMemo } from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useBaseCurrency } from '@/features/auth';
import { Transaction, TransactionListItem, TransactionListItemSkeleton } from '@/features/transactions';
import { Transfer, TransferListItem, TransferListItemSkeleton } from '@/features/transfers';

interface Props {
  date: Moment;
  items: (Transaction | Transfer)[];
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

  const { netAmount, transferAmount } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      const v = tx.convertedValues?.[baseCurrency] ?? 0;
      if (tx.isIncome()) income += v;
      else expense += v;
    }

    let trAmount = 0;
    for (const tr of transfers) {
      trAmount += tr.fromExpense?.convertedValues?.[baseCurrency] ?? 0;
    }

    return { netAmount: income - expense, transferAmount: trAmount };
  }, [transactions, transfers, baseCurrency]);

  return (
    <Card className="h-full w-full overflow-hidden">
      <CardContent className="h-full p-0 flex flex-col">
        <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
          <h4 className="text-base font-semibold leading-6">
            <RelativeDatetimeDisplay showDayBadge badgeSize="sm" date={date} showTime={false} variant="default" />
          </h4>

          <div className="flex items-center gap-2 shrink-0">
            <SummaryBadge count={transactions.length} icon={ROUTES.TRANSACTION_LIST.icon} value={netAmount} />
            <SummaryBadge
              count={transfers.length}
              icon={ROUTES.TRANSFER_LIST.icon}
              useColors={false}
              value={transferAmount}
            />
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li className="max-w-full" key={item.id}>
                  {item instanceof Transaction && <TransactionListItem transaction={item} />}
                  {item instanceof Transfer && <TransferListItem transfer={item} />}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DateCardSkeleton: React.FC = React.memo(() => (
  <Card className="h-full w-full overflow-hidden">
    <CardContent className="h-full p-0 flex flex-col">
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-5 w-28" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-3">
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
