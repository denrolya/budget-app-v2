import { Moment } from 'moment';
import React from 'react';

import DesktopTable, { DesktopTableSkeleton } from '@/components/features/transactions/DesktopTable';
import EmptyTransactionState from '@/components/features/transactions/EmptyTransactionState';
import List, { ListSkeleton } from '@/components/features/transactions/List';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Transaction from '@/models/Transaction.ts';

interface Props {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  groupedTransactions: [Moment, Transaction[], number, number][];
  refetch: () => void;
  onAddTransaction: () => void;
}

const FormattedListing: React.FC<Props> = ({
                                             isLoading,
                                             isError,
                                             error,
                                             groupedTransactions,
                                             refetch,
                                             onAddTransaction,
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
          <DesktopTableSkeleton />
        </div>
      </>
    )}

    {(!isLoading && !isError && groupedTransactions) && (
      <>
        {groupedTransactions.length > 0 && (
          <>
            <div className="hidden md:block">
              <DesktopTable groupedTransactions={groupedTransactions} />
            </div>
            <div className="md:hidden">
              <List groupedTransactions={groupedTransactions} />
            </div>
          </>
        )}
        {groupedTransactions.length === 0 && (
          <EmptyTransactionState
            onRefresh={refetch}
            onAddTransaction={onAddTransaction} />
        )}
      </>
    )}
  </>
);

FormattedListing.displayName = 'FormattedListing';

export default FormattedListing;
