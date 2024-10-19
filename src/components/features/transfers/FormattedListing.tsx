import { Moment } from 'moment';
import React from 'react';

import Pagination from '@/components/common/Pagination';
import EmptyTransferState from '@/components/features/transfers/EmptyTransferState';
import List, { ListSkeleton } from '@/components/features/transfers/List';
import TableListing from '@/components/features/transfers/TableListing';
import TableListingSkeleton from '@/components/features/transfers/TableListingSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Transfer from '@/models/Transfer';

interface Props {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  groupedItems: [Moment, Transfer[], number, number][];
  refetch: () => void;
  onAdd: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPage: number;
  totalItems: number;
}

const FormattedListing: React.FC<Props> = ({
                                             isLoading,
                                             isError,
                                             error,
                                             groupedItems,
                                             refetch,
                                             onAdd,
                                             currentPage,
                                             totalPages,
                                             onPageChange,
                                             onPerPageChange,
                                             perPage,
                                             totalItems,
                                           }) => (
  <>
    {isError && (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message || 'An unexpected error occurred.'}</AlertDescription>
      </Alert>
    )}

    {isLoading && (
      <>
        <div className="md:hidden">
          <ListSkeleton />
        </div>
        <div className="hidden md:block">
          <TableListingSkeleton />
        </div>
      </>
    )}

    {(!isLoading && !isError && groupedItems) && (
      <>
        {groupedItems.length > 0 && (
          <>
            <div className="hidden md:block">
              <TableListing groupedItems={groupedItems} />
            </div>
            <div className="md:hidden">
              <List groupedItems={groupedItems} />
            </div>
          </>
        )}
        {groupedItems.length === 0 && (
          <EmptyTransferState
            onRefresh={refetch}
            onAddTransfer={onAdd} />
        )}
      </>
    )}

    <div className="px-6 py-4">
      <Pagination
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        perPage={perPage}
        totalItems={totalItems}
      />
    </div>
  </>
);

FormattedListing.displayName = 'FormattedTransfersListing';

export default FormattedListing;
