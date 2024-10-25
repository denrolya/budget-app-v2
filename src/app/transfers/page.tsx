import React from 'react';

import FormattedListing from '@/components/features/transfers/FormattedListing';
import ListFilters from '@/components/features/transfers/ListFilters';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransfers } from '@/hooks/useTransfers';

export const TransfersListPage: React.FC = () => {
  const {
    groupedItems,
    isLoading,
    isError,
    error,
    refetch,
    pagination: { currentPage, totalPages, totalItems, perPage, setCurrentPage, setPerPage },
    filters,
    setFilter,
    resetFilters,
    isFetching,
  } = useTransfers();
  const { openForm } = useFormContext();
  const onAddTransfer = () => openForm(FormType.Transfer);

  return (
    <section className="w-full p-4 md:p-0 mx-auto pb-20 md:pb-0">
      <div className="flex-grow overflow-hidden flex flex-col mb-6">
        <FormattedListing
          isLoading={isLoading}
          isError={isError}
          error={error}
          groupedItems={groupedItems}
          refetch={refetch}
          onAdd={onAddTransfer}
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

TransfersListPage.displayName = 'TransfersListPage';

export default TransfersListPage;
