import { Moment } from 'moment';
import React from 'react';

import EmptyTransferState from '@/features/transfers/components/EmptyTransferState';
import List, { ListSkeleton } from '@/features/transfers/components/List';
import TableListing from '@/features/transfers/components/TableListing';
import TableListingSkeleton from '@/features/transfers/components/TableListingSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Transfer from '@/features/transfers/models/Transfer';

interface Props {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  groupedItems: [Moment, Transfer[], number, number][];
  refetch: () => void;
  onAdd: () => void;
}

const FormattedListing: React.FC<Props> = ({ isLoading, isError, error, groupedItems, refetch, onAdd }) => (
  <>
    {isError && (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message || 'An unexpected error occurred.'}</AlertDescription>
      </Alert>
    )}

    <div className="md:hidden">
      {isLoading && <ListSkeleton />}
      {!isLoading && groupedItems.length > 0 && <List groupedItems={groupedItems} />}
      {!isLoading && groupedItems.length === 0 && <EmptyTransferState onAddTransfer={onAdd} onRefresh={refetch} />}
    </div>

    <div className="hidden md:block">
      {isLoading && <TableListingSkeleton />}
      {!isLoading && groupedItems.length > 0 && <TableListing groupedItems={groupedItems} />}
      {!isLoading && groupedItems.length === 0 && <EmptyTransferState onAddTransfer={onAdd} onRefresh={refetch} />}
    </div>
  </>
);

FormattedListing.displayName = 'FormattedTransfersListing';

export default FormattedListing;
