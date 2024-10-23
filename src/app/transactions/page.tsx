import React from 'react';

import FormattedListing from '@/components/features/transactions/FormattedListing';
import ListFilters from '@/components/features/transactions/ListFilters';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactions } from '@/hooks/useTransactions';

export const TransactionsListPage: React.FC = () => {
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
