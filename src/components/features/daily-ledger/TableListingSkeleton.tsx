
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay.tsx';
import { ArrowRight } from 'lucide-react';
import moment, { Moment } from 'moment';
import React from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  daysPerPage: number;
  currentDate: Moment;
}

export const TableListingSkeleton: React.FC<Props> = ({ daysPerPage, currentDate }) => {
  const dates = Array.from({ length: daysPerPage }, (_, i) => moment(currentDate).subtract(i, 'days'));

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
            <React.Fragment key={date.format('YYYY-MM-DD')}>
              <TableRow>
                <TableCell colSpan={8} className="font-semibold bg-muted">
                  <div className="flex flex-wrap justify-between items-center">
                    <RelativeDatetimeDisplay showTime={false} date={date} />
                    <div className="text-sm font-normal">
                      <Skeleton className="w-64 h-6" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              {Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="w-4"></TableCell>
                  <TableCell><Skeleton className="w-12 h-4" /></TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-16 h-6 rounded-full" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Skeleton className="w-16 h-6 rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="w-24 h-6" /></TableCell>
                  <TableCell><Skeleton className="w-20 h-6" /></TableCell>
                  <TableCell><Skeleton className="w-32 h-4" /></TableCell>
                  <TableCell><Skeleton className="w-16 h-4" /></TableCell>
                  <TableCell className="text-right">
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
