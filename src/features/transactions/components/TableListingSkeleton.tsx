import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type ListingRowSkeletonProps = {
  className?: string;
};

type TableListingSkeletonProps = ListingRowSkeletonProps & {
  rowsPerGroup?: number;
  groups?: number;
} & React.ComponentPropsWithoutRef<typeof Table>;

const DEFAULT_ROWS_PER_GROUP = 3;
const DEFAULT_GROUPS = 2;

export const ListingRowSkeleton: React.FC<ListingRowSkeletonProps> = ({ className }) => (
  <TableRow aria-hidden="true" className={cn('text-xs hover:bg-transparent', className)}>
    {/* gutter */}
    <TableCell className="w-4 p-0" />

    {/* id */}
    <TableCell className="pl-4 p-0">
      <Skeleton className="h-4 w-14" />
    </TableCell>

    {/* account */}
    <TableCell className="p-0">
      <Skeleton className="h-6 w-28 rounded-full" />
    </TableCell>

    {/* amount */}
    <TableCell className="p-0">
      <Skeleton className="h-6 w-24" />
    </TableCell>

    {/* category */}
    <TableCell className="p-0">
      <Skeleton className="h-6 w-24" />
    </TableCell>

    {/* note */}
    <TableCell className="p-0">
      <Skeleton className="h-4 w-40 sm:w-56" />
    </TableCell>

    {/* time */}
    <TableCell className="whitespace-nowrap p-0">
      <Skeleton className="h-4 w-14" />
    </TableCell>

    {/* actions */}
    <TableCell className="text-right p-0">
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </TableCell>
  </TableRow>
);

ListingRowSkeleton.displayName = 'TransactionListingRowSkeleton';

const GroupHeaderSkeleton: React.FC = () => (
  <TableRow aria-hidden="true">
    <TableCell colSpan={8} className="bg-muted/40 px-4 py-0">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-32" />
      </div>
    </TableCell>
  </TableRow>
);

GroupHeaderSkeleton.displayName = 'TransactionListingGroupHeaderSkeleton';

export const TransactionsTableListingSkeleton: React.FC<TableListingSkeletonProps> = ({
  className,
  rowsPerGroup = DEFAULT_ROWS_PER_GROUP,
  groups = DEFAULT_GROUPS,
  ...tableProps
}) => (
  <div aria-label="Loading transactions table" role="status" className="overflow-x-auto">
    <Table className="min-w-[860px] table-fixed" {...tableProps}>
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
          <TableHead>Account</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody aria-busy="true">
        {Array.from({ length: groups }).map((_, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <GroupHeaderSkeleton />
            {Array.from({ length: rowsPerGroup }).map((__, rowIndex) => (
              <ListingRowSkeleton className={className} key={`${groupIndex}-${rowIndex}`} />
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  </div>
);

TransactionsTableListingSkeleton.displayName = 'TransactionsTableListingSkeleton';

export default TransactionsTableListingSkeleton;
