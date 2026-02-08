import { Moment } from 'moment';
import React, { useMemo } from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';
import { ListingRowSkeleton as TransferListingRowSkeleton } from '@/features/transfers/components/TableListingSkeleton';
import { ListingRowSkeleton as TransactionListingRowSkeleton } from '@/features/transactions/components/TableListingSkeleton';

interface Props {
  after: Moment;
  before: Moment;
  compact?: boolean;
  rowsPerDay?: number;
  isReversedOrder?: boolean;
  showEmptyDays?: boolean;
}

export const TableListingSkeleton: React.FC<Props> = ({
                                                        after,
                                                        before,
                                                        compact = true,
                                                        rowsPerDay = 3,
                                                        isReversedOrder = true,
                                                        showEmptyDays = true,
                                                      }) => {
  const dates = useMemo(() => {
    const out: Moment[] = [];
    const current = after.clone();
    while (current.isSameOrBefore(before)) {
      out.push(current.clone());
      current.add(1, 'day');
    }
    return isReversedOrder ? out.reverse() : out;
  }, [after, before, isReversedOrder]);

  const rowPadClass = compact ? 'py-0' : undefined;

  const dayRows = useMemo(() => {
    if (!showEmptyDays) return dates.slice(0, Math.min(dates.length, 7));
    return dates;
  }, [dates, showEmptyDays]);

  return (
    <div aria-label="Loading transactions and transfers table" role="status" className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead className="w-4" />
            <TableHead className="w-1/12">ID</TableHead>
            <TableHead className="w-2/12">Account/Transfer</TableHead>
            <TableHead className="w-2/12">Amount</TableHead>
            <TableHead className="w-2/12">Category/Rate</TableHead>
            <TableHead className="w-2/12">Note</TableHead>
            <TableHead className="w-1/12">Time</TableHead>
            <TableHead className="w-1/12 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody aria-busy="true">
          {dayRows.map((date) => (
            <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
              {/* Day header skeleton */}
              <TableRow aria-hidden="true">
                <TableCell colSpan={8} className={cn('bg-muted/40 px-4', rowPadClass)}>
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <RelativeDatetimeDisplay
                      showDayBadge
                      badgeSize="sm"
                      date={date}
                      showTime={false}
                      variant="default" />
                    <div className="flex items-center gap-3 font-normal">
                      <Skeleton className="h-6 w-28 sm:w-32" />
                      <Skeleton className="h-6 w-28 sm:w-32" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>

              {/* Item rows skeleton: mix tx + transfer row skeletons */}
              {Array.from({ length: rowsPerDay }).map((_, index) => {
                // deterministic mix; tweak ratio as desired
                const isTransfer = index % 3 === 0;

                return isTransfer ? (
                  <TransferListingRowSkeleton
                    compact={compact}
                    key={`${date.format(BACKEND_DATE_FORMAT)}-tr-${index}`}
                  />
                ) : (
                  <TransactionListingRowSkeleton
                    compact={compact}
                    key={`${date.format(BACKEND_DATE_FORMAT)}-tx-${index}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

TableListingSkeleton.displayName = 'TransactionsAndTransfersTableListingSkeleton';

export default TableListingSkeleton;
