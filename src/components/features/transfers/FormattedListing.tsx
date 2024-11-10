import { Moment } from 'moment';
import React from 'react';

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
}

const FormattedListing: React.FC<Props> = ({
                                             isLoading,
                                             isError,
                                             error,
                                             groupedItems,
                                             refetch,
                                             onAdd,
                                           }) => (
  <>
    {isError && (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message || 'An unexpected error occurred.'}</AlertDescription>
      </Alert>
    )}

    <div className="md:hidden">
      {isLoading && <ListSkeleton />}
      {(!isLoading && groupedItems.length > 0) && <List groupedItems={groupedItems} />}
      {(!isLoading && groupedItems.length === 0) && <EmptyTransferState onRefresh={refetch} onAddTransfer={onAdd} />}
    </div>
    
    <div className="hidden md:block">
      {isLoading && <TableListingSkeleton />}
      {(!isLoading && groupedItems.length > 0) && <TableListing groupedItems={groupedItems} />}
      {(!isLoading && groupedItems.length === 0) && <EmptyTransferState onRefresh={refetch} onAddTransfer={onAdd} />}
    </div>
  </>
);

FormattedListing.displayName = 'FormattedTransfersListing';

export default FormattedListing;
