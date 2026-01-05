import { Moment } from 'moment';
import React from 'react';

import EmptyTransactionState from '@/components/features/transactions/EmptyTransactionState';
import List, { ListSkeleton } from '@/components/features/transactions/List';
import TableListing from '@/components/features/transactions/TableListing';
import TableListingSkeleton from '@/components/features/transactions/TableListingSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Transaction from '@/models/Transaction';

interface Props {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  groupedItems: [Moment, Transaction[], number, number][];
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

      {!isLoading && !groupedItems.length && <EmptyTransactionState onAddTransaction={onAdd} onRefresh={refetch} />}
    </div>

    <div className="hidden md:block">
      {isLoading && <TableListingSkeleton />}

      {!isLoading && groupedItems.length > 0 && <TableListing groupedItems={groupedItems} />}

      {!isLoading && !groupedItems.length && <EmptyTransactionState onAddTransaction={onAdd} onRefresh={refetch} />}
    </div>
  </>
);

FormattedListing.displayName = 'FormattedTransactionsListing';

export default FormattedListing;
