import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SkeletonProps extends React.ComponentPropsWithoutRef<'div'> {
  rowsPerGroup?: number;
  numberOfGroups?: number;
}

export const TableListingSkeleton: React.FC<SkeletonProps> = ({ rowsPerGroup = 3, numberOfGroups = 2, ...props }) => {
  const renderSkeletonGroup = (groupIndex: number) => (
    <React.Fragment key={groupIndex}>
      <TableRow>
        <TableCell colSpan={8} className="bg-muted px-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </TableCell>
      </TableRow>
      {[...Array(rowsPerGroup)].map((_, rowIndex) => (
        <TableRow key={`${groupIndex}-${rowIndex}`}>
          <TableCell />
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-6 w-6 " />
              <Skeleton className="h-6 w-6" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </React.Fragment>
  );

  return (
    <Table {...props}>
      <TableHeader className="sr-only">
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{[...Array(numberOfGroups)].map((_, index) => renderSkeletonGroup(index))}</TableBody>
    </Table>
  );
};

TableListingSkeleton.displayName = 'TransactionsTableListingSkeleton';

export default TableListingSkeleton;
