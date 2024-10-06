import React, { useMemo } from 'react';
import moment from 'moment';

import { Pagination } from '@/components/common/Pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactions } from '@/hooks/useTransactions';
import Transaction from '@/models/Transaction';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import EmptyTransactionState from '@/components/features/transactions/EmptyTransactionState';
import ListFilters from '@/components/features/transactions/ListFilters';
import TransactionListItemV3, { ListItemSkeleton } from '@/components/features/transactions/ListItemV3';

const GroupedTransactions: React.FC<{ groupedTransactions: [string, Transaction[]][] }> = ({ groupedTransactions }) => (
  <>
    {groupedTransactions.map(([date, transactions]) => (
      <div key={date} className="mb-6">
        <h5 className="text-lg font-semibold mb-2">
          <RelativeDatetimeDisplay showTime={false} date={moment(date)} />
        </h5>
        <ul className="space-y-2">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="relative">
              <TransactionListItemV3 transaction={transaction} />
            </li>
          ))}
        </ul>
      </div>
    ))}
  </>
);

export const TransactionsList: React.FC = () => {
  const { openForm } = useFormContext();
  const {
    transactions,
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

  const groupedAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];

    const grouped = transactions.reduce((groups, transaction) => {
      const date = moment(transaction.executedAt).format('YYYY-MM-DD');
      return { ...groups, [date]: [...(groups[date] || []), transaction] };
    }, {} as Record<string, Transaction[]>);

    return Object.entries(grouped).sort(([dateA, dateB]) => moment(dateB).diff(moment(dateA)));
  }, [transactions]);

  return (
    <section className="container p-4 mx-auto pb-20 md:pb-4">
      <div className="flex-grow overflow-hidden flex flex-col mb-6">
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message || 'An unexpected error occurred.'}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <ul className="space-y-2">
            {Array.from({ length: perPage }, (_, index) => (
              <li key={index}><ListItemSkeleton /></li>
            ))}
          </ul>
        )}

        {(!isLoading && !isError && transactions) && (
          <>
            {groupedAndSortedTransactions.length > 0 && (
              <>
                <GroupedTransactions groupedTransactions={groupedAndSortedTransactions} />
                <div className="mt-4">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              </>
            )}
            {groupedAndSortedTransactions.length === 0 &&
              <EmptyTransactionState onRefresh={refetch} onAddTransaction={() => openForm(FormType.Transaction)} />}
          </>
        )}

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
