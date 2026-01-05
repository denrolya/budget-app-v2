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
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { useBaseCurrency } from '@/contexts/auth';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';

interface Props {
  date: Moment;
  items: (Transaction | Transfer)[];
}

type Totals = {
  transactionsCount: number;
  transfersCount: number;
  netAmount: number;
  transferAmount: number;
};

const computeTotals = (items: (Transaction | Transfer)[], baseCurrency: string): Totals => {
  let transactionsCount = 0;
  let transfersCount = 0;

  let income = 0;
  let expense = 0;
  let transferAmount = 0;

  items.forEach((it) => {
    if (it instanceof Transaction) {
      transactionsCount += 1;
      const v = it.convertedValues?.[baseCurrency] ?? 0;
      if (it.isIncome()) income += v;
      else expense += v;
      return;
    }

    const tr = it as Transfer;
    transfersCount += 1;
    transferAmount += tr.fromExpense?.convertedValues?.[baseCurrency] ?? 0;
  });

  return {
    transactionsCount,
    transfersCount,
    netAmount: income - expense,
    transferAmount,
  };
};

export const DateCard: React.FC<Props> = ({ date, items }) => {
  const baseCurrency = useBaseCurrency();

  const { transactionsCount, transfersCount, netAmount, transferAmount } = useMemo(
    () => computeTotals(items, baseCurrency),
    [items, baseCurrency],
  );

  const headingId = useMemo(() => `daily-ledger-day-${date.format(BACKEND_DATE_FORMAT)}`, [date]);

  return (
    <Card className="h-full w-full overflow-hidden">
      <CardContent aria-labelledby={headingId} className="flex h-full flex-col p-0">
        <header className="border-b px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-base font-semibold leading-tight">
              <RelativeDatetimeDisplay
                showDayBadge
                badgeSize="sm"
                date={date}
                showTime={false}
                variant="default"
              />
            </h4>

            <div aria-label="Day summary" className="flex flex-wrap items-center gap-2 text-sm">
              <SummaryBadge count={transactionsCount} icon={ROUTES.TRANSACTION_LIST.icon} value={netAmount} />
              <SummaryBadge count={transfersCount} icon={ROUTES.TRANSFER_LIST.icon} value={transferAmount} />
            </div>
          </div>
        </header>

        <div aria-label="Items" role="region" className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {items.length === 0 && <div className="text-sm text-muted-foreground">No items</div>}

          {items.length > 0 && (
            <ul aria-label="Transactions and transfers" role="list" className="flex flex-col gap-4">
              {items.map((item) => (
                <li className="max-w-full" key={item.id}>
                  {item instanceof Transaction && <TransactionListItem transaction={item} />}
                  {item instanceof Transfer && <TransferListItem transfer={item as Transfer} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const DateCardSkeleton: React.FC = React.memo(() => (
  <Card aria-busy="true" className="h-full w-full overflow-hidden">
    <CardContent className="flex h-full flex-col p-0">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 w-full sm:flex-1" />
          <Skeleton className="h-10 w-full sm:flex-1" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <ul aria-label="Loading items" role="list" className="flex flex-col gap-4">
          <li>
            <TransactionListItemSkeleton />
          </li>
          <li>
            <TransferListItemSkeleton />
          </li>
          <li>
            <TransactionListItemSkeleton />
          </li>
        </ul>
      </div>
    </CardContent>
  </Card>
));

DateCard.displayName = 'DailyLedgerDateCard';
DateCardSkeleton.displayName = 'DailyLedgerDateCardSkeleton';

export default DateCard;
