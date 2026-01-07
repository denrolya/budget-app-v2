import { Moment } from 'moment';
import React from 'react';

import EmptyTransactionState from '@/features/transactions/components/EmptyTransactionState';
import List, { ListSkeleton } from '@/features/transactions/components/List';
import TableListing from '@/features/transactions/components/TableListing';
import TableListingSkeleton from '@/features/transactions/components/TableListingSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Transaction from '@/features/transactions/models/Transaction';

interface Props {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  groupedItems: [Moment, Transaction[], number, number][];
  refetch: () => void;
  onAdd: () => void;
}

const FormattedListing: React.FC<Props> = ({ isLoading, isError, error, groupedItems, refetch, onAdd }) => (
  <div className="px-2 py-2 md:px-0 md:py-0">
    {isError && (
      <Alert aria-live="polite" variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message || 'An unexpected error occurred.'}</AlertDescription>
      </Alert>
    )}

    <div className="md:hidden">
      {isLoading && <ListSkeleton />}
      {!isLoading && groupedItems.length > 0 && <List groupedItems={groupedItems} />}
      {!isLoading && groupedItems.length === 0 &&
        <EmptyTransactionState onAddTransaction={onAdd} onRefresh={refetch} />}
    </div>

    <div className="hidden md:block">
      {isLoading && <TableListingSkeleton />}
      {!isLoading && groupedItems.length > 0 && <TableListing groupedItems={groupedItems} />}
      {!isLoading && groupedItems.length === 0 &&
        <EmptyTransactionState onAddTransaction={onAdd} onRefresh={refetch} />}
    </div>
  </div>
);

FormattedListing.displayName = 'FormattedTransactionsListing';

export default FormattedListing;
