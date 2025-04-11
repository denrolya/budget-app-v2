import { Moment } from 'moment';
import React from 'react';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { MoneyValue } from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import ListItem, { ListItemSkeleton } from '@/components/features/transactions/ListItemV3';
import { Separator } from '@/components/ui/separator';
import Transaction from '@/models/Transaction';
import { Skeleton } from '@/components/ui/skeleton';

interface ListSkeletonProps extends React.ComponentPropsWithoutRef<'div'> {
  groupCount?: number;
  transactionsPerGroup?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ groupCount = 3, transactionsPerGroup = 5, ...props }) => (
  <div {...props}>
    {Array.from({ length: groupCount }).map((_, groupIndex) => (
      <React.Fragment key={groupIndex}>
        <div className="space-y-2">
          <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <Skeleton className="h-7 w-40" />
            <div className="flex items-center space-x-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-1" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <ul className="space-y-2">
            {Array.from({ length: transactionsPerGroup }).map((_, transactionIndex) => (
              <li key={transactionIndex}>
                <ListItemSkeleton />
              </li>
            ))}
          </ul>
        </div>
        {groupIndex < groupCount - 1 && <Separator className="my-6" />}
      </React.Fragment>
    ))}
  </div>
);

ListSkeleton.displayName = 'TransactionsGroupedListSkeleton';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  groupedItems: [Moment, Transaction[], number, number][];
}

export const List: React.FC<Props> = ({ groupedItems, ...props }) => (
  <div {...props}>
    {groupedItems.map(([date, transactions, totalValue, count], index) => (
      <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
        <div className="space-y-2">
          <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h2 className="text-lg font-semibold">
              <RelativeDatetimeDisplay showTime={false} date={date} />
            </h2>
            <div className="text-sm text-muted-foreground">
              <span>{count} transactions</span>
              <span className="mx-1">•</span>
              <span>
                <MoneyValue amount={totalValue} />
              </span>
            </div>
          </div>
          <ul className="space-y-2">
            {transactions.map((transaction) => (
              <li key={transaction.id}>
                <ListItem transaction={transaction} />
              </li>
            ))}
          </ul>
        </div>
        {index < groupedItems.length - 1 && <Separator className="my-6" />}
      </React.Fragment>
    ))}
  </div>
);

List.displayName = 'TransactionsGroupedList';

export default List;
