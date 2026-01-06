import { Moment } from 'moment';
import React from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import SummaryBadge from '@/components/common/SummaryBadge';
import ListItem, { ListItemSkeleton } from '@/features/transactions/components/ListItemV3';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import Transaction from '@/models/Transaction';

interface ListSkeletonProps extends React.ComponentPropsWithoutRef<'div'> {
  groupCount?: number;
  transactionsPerGroup?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
                                                            groupCount = 3,
                                                            transactionsPerGroup = 5,
                                                            ...props
                                                          }) => (
  <div {...props} className="flex flex-col gap-3">
    {Array.from({ length: groupCount }).map((_, groupIndex) => (
      <Card className="w-full overflow-hidden" key={groupIndex}>
        <CardContent className="p-0 flex flex-col">
          <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-5 w-28" />
          </div>

          <div className="px-3 py-2">
            <ul aria-label="Transactions" className="flex flex-col gap-3">
              {Array.from({ length: transactionsPerGroup }).map((__, i) => (
                <li key={i}>
                  <ListItemSkeleton />
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

ListSkeleton.displayName = 'TransactionsGroupedListSkeleton';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  groupedItems: [Moment, Transaction[], number, number][];
}

export const List: React.FC<Props> = ({ groupedItems, ...props }) => (
  <div {...props} className="flex flex-col gap-3">
    {groupedItems.map(([date, transactions, totalValue, count]) => (
      <Card className="w-full overflow-hidden" key={date.format(BACKEND_DATE_FORMAT)}>
        <CardContent className="p-0 flex flex-col">
          <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
            <h4 className="text-base font-semibold leading-6">
              <RelativeDatetimeDisplay showDayBadge badgeSize="sm" date={date} showTime={false} variant="default" />
            </h4>

            <div className="shrink-0">
              <SummaryBadge count={count} icon={ROUTES.TRANSACTION_LIST.icon} value={totalValue} />
            </div>
          </div>

          <div className="px-3 py-2">
            <ul aria-label={`Transactions for ${date.format('YYYY-MM-DD')}`} className="flex flex-col gap-3">
              {transactions.map((transaction) => (
                <li key={transaction.id}>
                  <ListItem transaction={transaction} />
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

List.displayName = 'TransactionsGroupedList';

export default List;
