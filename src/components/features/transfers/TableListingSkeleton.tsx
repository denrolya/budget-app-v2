import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SkeletonProps {
  rowsPerGroup?: number;
  numberOfGroups?: number;
}

export const TableListingSkeleton: React.FC<SkeletonProps> = ({ rowsPerGroup = 3, numberOfGroups = 2, ...props }) => {
  const renderSkeletonGroup = (groupIndex: number) => (
    <React.Fragment key={groupIndex}>
      <TableRow>
        <TableCell colSpan={10} className="bg-muted">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </TableCell>
      </TableRow>
      {[...Array(rowsPerGroup)].map((_, rowIndex) => (
        <TableRow key={`${groupIndex}-${rowIndex}`}>
          <TableCell className="w-4" />
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell>
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </React.Fragment>
  );

  return (
    <div className="overflow-x-auto">
      <Table {...props}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-4"></TableHead>
            <TableHead className="w-1/12">ID</TableHead>
            <TableHead className="w-3/12">Transfer</TableHead>
            <TableHead className="w-1/12">Rate</TableHead>
            <TableHead className="w-1/12">Amount</TableHead>
            <TableHead className="w-1/12">Result</TableHead>
            <TableHead className="w-2/12">Fee</TableHead>
            <TableHead className="w-2/12">Note</TableHead>
            <TableHead className="w-1/12">Time</TableHead>
            <TableHead className="w-1/12 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(numberOfGroups)].map((_, index) => renderSkeletonGroup(index))}
        </TableBody>
      </Table>
    </div>
  );
};

TableListingSkeleton.displayName = 'TransfersTableListingSkeleton';

export default TableListingSkeleton;
