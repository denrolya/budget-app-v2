import React, { useState } from 'react';

import BulkCreateTableForm from '@/components/features/transactions/BulkCreateTableForm';
import FormattedListing from '@/components/features/transactions/FormattedListing';
import ListFilters from '@/components/features/transactions/ListFilters';
import { Button } from '@/components/ui/button';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useTransactions } from '@/hooks/useTransactions';

export const TransactionsListPage: React.FC = () => {
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const isDesktop = useScreenSize();
  const { openForm } = useFormContext();
  const {
    groupedItems,
    isLoading,
    isError,
    error,
    refetch,
    pagination: { currentPage, totalPages, perPage, totalItems, setCurrentPage, setPerPage },
    filters,
    setFilter,
    resetFilters,
    isFetching,
  } = useTransactions();
  const onAddTransaction = () => openForm(FormType.Transaction);

  return (
    <section className="w-full p-4 md:p-0 mx-auto pb-20 md:pb-0">
      {isDesktop && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl">Existing Transactions</h2>
            <Button onClick={() => setShowBulkCreate(!showBulkCreate)}>
              {showBulkCreate ? 'Hide Bulk Create' : 'Show Bulk Create'}
            </Button>
          </div>

          {showBulkCreate && (
            <div className="bg-muted">
              <BulkCreateTableForm />
            </div>
          )}
        </>
      )}

      <div className="flex-grow overflow-hidden flex flex-col mb-6">
        <FormattedListing
          isLoading={isLoading}
          isError={isError}
          error={error}
          groupedItems={groupedItems}
          refetch={refetch}
          onAdd={onAddTransaction}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPerPageChange={setPerPage}
          perPage={perPage}
          totalItems={totalItems}
        />

        <ListFilters data={filters} onChange={setFilter} onReset={resetFilters} />

        {(isFetching && !isLoading) && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded">
            Updating...
          </div>
        )}
      </div>
    </section>
  );
};

TransactionsListPage.displayName = 'TransactionsListPage';

export default TransactionsListPage;
