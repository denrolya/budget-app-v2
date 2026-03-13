import { type Moment } from 'moment';
import React, { useMemo } from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { TransactionListingRowSkeleton } from '@/features/transactions';
import { TransferListingRowSkeleton } from '@/features/transfers';

interface Props {
  after: Moment;
  before: Moment;
  rowsPerDay?: number;
  isReversedOrder?: boolean;
  showEmptyDays?: boolean;
}

export const TableListingSkeleton: React.FC<Props> = ({
  after,
  before,
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

  const dayRows = useMemo(() => {
    if (!showEmptyDays) return dates.slice(0, Math.min(dates.length, 7));
    return dates;
  }, [dates, showEmptyDays]);

  return (
    <div aria-label="Loading transactions and transfers table" role="status" className="overflow-x-auto">
      <Table className="min-w-[860px] table-fixed">
        <colgroup>
          <col className="w-4" />
          <col className="w-24" />
          <col className="w-[220px]" />
          <col className="w-40" />
          <col className="w-32" />
          <col />
          <col className="w-20" />
          <col className="w-24" />
        </colgroup>
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead />
            <TableHead>ID</TableHead>
            <TableHead>Account/Transfer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category/Rate</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody aria-busy="true">
          {dayRows.map((date) => (
            <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
              {/* Day header skeleton */}
              <TableRow aria-hidden="true">
                <TableCell colSpan={8} className="bg-muted/40 px-4 py-0">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <RelativeDatetimeDisplay
                      showDayBadge
                      badgeSize="sm"
                      date={date}
                      showTime={false}
                      variant="default"
                    />
                    <div className="flex items-center gap-3 font-normal">
                      <Skeleton className="h-6 w-28 sm:w-32" />
                      <Skeleton className="h-6 w-28 sm:w-32" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>

              {/* Item row skeletons: mix transaction + transfer */}
              {Array.from({ length: rowsPerDay }).map((_, index) => {
                const isTransfer = index % 3 === 0;

                return isTransfer ? (
                  <TransferListingRowSkeleton key={`${date.format(BACKEND_DATE_FORMAT)}-transfer-${index}`} />
                ) : (
                  <TransactionListingRowSkeleton key={`${date.format(BACKEND_DATE_FORMAT)}-transaction-${index}`} />
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
