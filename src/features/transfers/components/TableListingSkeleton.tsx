import { ArrowRight } from 'lucide-react';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type RowSkeletonProps = {
  className?: string;
};

type TableSkeletonProps = RowSkeletonProps & {
  rowsPerGroup?: number;
  groups?: number;
} & React.ComponentPropsWithoutRef<typeof Table>;

const DEFAULT_ROWS_PER_GROUP = 3;
const DEFAULT_GROUPS = 2;

export const ListingRowSkeleton: React.FC<RowSkeletonProps> = ({ className }) => (
  <TableRow aria-hidden="true" className={cn('text-xs hover:bg-transparent', className)}>
    {/* gutter */}
    <TableCell className="w-4 p-0" />

    {/* id */}
    <TableCell className="pl-4 p-0">
      <Skeleton className="h-4 w-14" />
    </TableCell>

    {/* transfer accounts */}
    <TableCell className="p-0">
      <div className="flex items-center gap-2 min-w-0">
        <Skeleton className="h-6 w-20 rounded-full" />
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </TableCell>

    {/* amount */}
    <TableCell className="p-0">
      <Skeleton className="h-6 w-40" />
      <div className="mt-1">
        <Skeleton className="h-3 w-20" />
      </div>
    </TableCell>

    {/* rate */}
    <TableCell className="p-0">
      <Skeleton className="h-6 w-24" />
      <div className="mt-1">
        <Skeleton className="h-3 w-16" />
      </div>
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
      </div>
    </TableCell>
  </TableRow>
);

ListingRowSkeleton.displayName = 'TransferListingRowSkeleton';

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

GroupHeaderSkeleton.displayName = 'TransferListingGroupHeaderSkeleton';

export const TransferTableListingSkeleton: React.FC<TableSkeletonProps> = ({
  className,
  rowsPerGroup = DEFAULT_ROWS_PER_GROUP,
  groups = DEFAULT_GROUPS,
  ...tableProps
}) => (
  <div aria-label="Loading transfers table" role="status" className="overflow-x-auto">
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
          <TableHead>Transfer</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Rate</TableHead>
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

TransferTableListingSkeleton.displayName = 'TransferTableListingSkeleton';

export default TransferTableListingSkeleton;
