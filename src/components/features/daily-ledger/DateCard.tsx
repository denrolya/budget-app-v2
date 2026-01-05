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
import { useIsMobile } from '@/hooks/use-mobile';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';

interface Props {
  date: Moment;
  items: (Transaction | Transfer)[];
}

const splitItems = (items: (Transaction | Transfer)[]) => {
  const transactions: Transaction[] = [];
  const transfers: Transfer[] = [];

  items.forEach((it) => {
    if (it instanceof Transaction) transactions.push(it);
    else transfers.push(it as Transfer);
  });

  return { transactions, transfers };
};

const computeTotals = (
  transactions: Transaction[],
  transfers: Transfer[],
  baseCurrency: string,
) => {
  let income = 0;
  let expense = 0;

  transactions.forEach((tx) => {
    const v = tx.convertedValues?.[baseCurrency] ?? 0;
    if (tx.isIncome()) income += v;
    else expense += v;
  });

  let transferAmount = 0;
  transfers.forEach((tr) => {
    transferAmount += tr.fromExpense?.convertedValues?.[baseCurrency] ?? 0;
  });

  return {
    netAmount: income - expense,
    transferAmount,
  };
};

export const DateCard: React.FC<Props> = ({ date, items }) => {
  const isMobile = useIsMobile();
  const baseCurrency = useBaseCurrency();

  const { transactions, transfers } = useMemo(
    () => splitItems(items),
    [items],
  );

  const { netAmount, transferAmount } = useMemo(
    () => computeTotals(transactions, transfers, baseCurrency),
    [transactions, transfers, baseCurrency],
  );

  const header = (
    <div className="flex flex-wrap justify-between border-b py-3">
      <h4 className="text-lg font-semibold flex items-center">
        <RelativeDatetimeDisplay
          showDayBadge
          badgeSize="sm"
          date={date}
          showTime={false}
          variant="default"
        />
      </h4>

      <div className="flex flex-wrap gap-2 text-sm pr-3">
        <SummaryBadge
          count={transactions.length}
          icon={ROUTES.TRANSACTION_LIST.icon}
          value={netAmount}
        />
        <SummaryBadge
          count={transfers.length}
          icon={ROUTES.TRANSFER_LIST.icon}
          useColors={false}
          value={transferAmount}
        />
      </div>
    </div>
  );

  const body =
    items.length > 0 ? (
      <ul className="pt-4 pb-4 md:pb-0 flex flex-col gap-4 flex-grow overflow-auto max-w-full">
        {items.map((item) => (
          <li className="max-w-full" key={item.id}>
            {item instanceof Transaction && (
              <TransactionListItem transaction={item} />
            )}
            {item instanceof Transfer && (
              <TransferListItem transfer={item} />
            )}
          </li>
        ))}
      </ul>
    ) : null;

  const content = (
    <div className="space-y-2">
      {header}
      {body}
    </div>
  );

  return (
    <div className="h-full w-full">
      {isMobile && <div className="px-2">{content}</div>}
      {!isMobile && (
        <Card className="h-full w-full overflow-hidden">
          <CardContent className="h-full p-4 overflow-y-auto">
            {content}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const DateCardSkeleton: React.FC = React.memo(() => {
  const isMobile = useIsMobile();

  const header = (
    <div className="flex flex-wrap justify-between border-b py-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="flex flex-wrap gap-2 text-sm pr-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );

  const body = (
    <ul className="pt-4 pb-4 md:pb-0 flex flex-col gap-4">
      <li><TransactionListItemSkeleton /></li>
      <li><TransferListItemSkeleton /></li>
      <li><TransactionListItemSkeleton /></li>
    </ul>
  );

  return (
    <div className="h-full w-full">
      {isMobile && (
        <div className="px-2 space-y-2">
          {header}
          {body}
        </div>
      )}

      {!isMobile && (
        <Card className="h-full w-full overflow-hidden">
          <CardContent className="h-full p-4 overflow-y-auto space-y-2">
            {header}
            {body}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

DateCard.displayName = 'DailyLedgerDateCard';
DateCardSkeleton.displayName = 'DailyLedgerDateCardSkeleton';

export default DateCard;
