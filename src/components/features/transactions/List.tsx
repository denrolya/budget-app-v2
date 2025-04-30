import { Moment } from 'moment';
import React from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import ListItem, { ListItemSkeleton } from '@/components/features/transactions/ListItemV3';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import Transaction from '@/models/Transaction';

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
          <div className="flex flex-wrap justify-between border-b py-3">
            <h4 className="text-lg font-semibold flex items-center">
              <RelativeDatetimeDisplay showDayBadge badgeSize="sm" variant="default" showTime={false} date={date} />
            </h4>
            <div className="flex flex-wrap gap-2 text-sm pr-3">
              <SummaryBadge icon={ROUTES.TRANSACTION_LIST.icon} count={count} value={totalValue} />
            </div>
          </div>
          <ul className="pt-4 pb-4 md:pb-0 flex flex-col gap-4 flex-grow overflow-auto max-w-full">
            {transactions.map((transaction) => (
              <li key={transaction.id}>
                <ListItem transaction={transaction} />
              </li>
            ))}
          </ul>
        </div>
      </React.Fragment>
    ))}
  </div>
);

List.displayName = 'TransactionsGroupedList';

export default List;
