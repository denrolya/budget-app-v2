import React from 'react';

import { Pagination } from '@/components/common/Pagination';
import FormattedListing from '@/components/features/transactions/FormattedListing';
import ListFilters from '@/components/features/transactions/ListFilters';
import { useForm as useFormContext } from '@/contexts/Form';
import { useTransactions } from '@/hooks/useTransactions';
import { FormType } from '@/contexts/Form';

export const TransactionsList: React.FC = () => {
  const { openForm } = useFormContext();
  const {
    groupedItems,
    isLoading,
    isError,
    error,
    refetch,
    pagination: { currentPage, totalPages, perPage, setCurrentPage },
    filters,
    setFilter,
    resetFilters,
    isFetching,
  } = useTransactions();

  return (
    <section className="w-full p-4 md:p-0 mx-auto pb-20 md:pb-0">
      <div className="flex-grow overflow-hidden flex flex-col mb-6">
        <FormattedListing
          isLoading={isLoading}
          isError={isError}
          error={error}
          groupedTransactions={groupedItems}
          refetch={refetch}
          onAddTransaction={() => openForm(FormType.Transaction)} />

        <div className="mt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>

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

export default TransactionsList;
