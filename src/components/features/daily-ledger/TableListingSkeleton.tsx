import { ArrowRight } from 'lucide-react';
import { Moment } from 'moment';
import React, { useMemo } from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { cn } from '@/lib/utils';

interface Props {
  after: Moment;
  before: Moment;
  compact?: boolean;
}

export const TableListingSkeleton: React.FC<Props> = ({ after, before, compact = false }) => {
  const dates = useMemo(() => {
    const dates = [];
    const currentDate = after.clone();
    while (currentDate.isSameOrBefore(before)) {
      dates.push(currentDate.clone());
      currentDate.add(1, 'day');
    }
    return dates.reverse(); // Reverse to show most recent dates first
  }, [after, before]);

  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead className="w-4"></TableHead>
            <TableHead className="w-1/12">ID</TableHead>
            <TableHead className="w-2/12">Type</TableHead>
            <TableHead className="w-2/12">Amount</TableHead>
            <TableHead className="w-2/12">Category/Rate</TableHead>
            <TableHead className="w-2/12">Note</TableHead>
            <TableHead className="w-1/12">Time</TableHead>
            <TableHead className="w-1/12 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dates.map((date) => (
            <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
              <TableRow>
                <TableCell colSpan={8} className={cn('font-semibold','bg-muted', 'px-4', { 'py-0': compact })}>
                  <div className="flex flex-wrap justify-between items-center">
                    <RelativeDatetimeDisplay
                      showDayBadge
                      badgeSize="sm"
                      variant="default"
                      showTime={false}
                      date={date}
                    />
                    <div className="text-sm flex flex-row space-x-4 font-normal">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              {Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell
                    className={cn('w-4', {
                      'p-0': compact,
                    })}></TableCell>
                  <TableCell className={cn({ 'p-0': compact })}>
                    <Skeleton className="w-12 h-4" />
                  </TableCell>
                  <TableCell className={cn({ 'p-0': compact })}>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-16 h-6 rounded-full" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Skeleton className="w-16 h-6 rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell className={cn({ 'p-0': compact })}>
                    <Skeleton className="w-24 h-6" />
                  </TableCell>
                  <TableCell className={cn({ 'p-0': compact })}>
                    <Skeleton className="w-20 h-6" />
                  </TableCell>
                  <TableCell className={cn({ 'p-0': compact })}>
                    <Skeleton className="w-32 h-4" />
                  </TableCell>
                  <TableCell className={cn({ 'p-0': compact })}>
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                  <TableCell
                    className={cn('text-right', {
                      'p-0': compact,
                    })}>
                    <div className="flex justify-end space-x-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

TableListingSkeleton.displayName = 'TransactionsAndTransfersTableListingSkeleton';

export default TableListingSkeleton;
