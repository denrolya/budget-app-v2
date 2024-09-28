import moment from 'moment';
import React, { useMemo } from 'react';

import { Pagination } from '@/components/common/Pagination';
import EmptyTransactionState from '@/components/features/transactions/EmptyTransactionState.tsx';
import ListFilters from '@/components/features/transactions/ListFilters';
import TransactionListItemV3, {
  ListItemSkeleton as TransactionListItemSkeletonV3,
} from '@/components/features/transactions/ListItemV3';
import { Button } from '@/components/ui/button';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useTransactions } from '@/hooks/useTransactions.tsx';
import Transaction from '@/models/Transaction';

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
    isFetching,
  } = useTransactions();

  const formatTransactionDate = (dateString: string): string => {
    const RECENT_THRESHOLD_DAYS = 7;
    const transactionDate = moment(dateString);
    const now = moment();

    const diffInDays = now.diff(transactionDate, 'day');

    const formattedDate = transactionDate.format('MMM D, YYYY'); // e.g., "Sep 16, 2024"

    if (diffInDays < RECENT_THRESHOLD_DAYS) {
      const relativeTime = transactionDate.fromNow(); // e.g., "3 days ago"
      return `${relativeTime} (${formattedDate})`; // e.g., "3 days ago (Sep 20, 2024)"
    } else {
      return formattedDate;
    }
  };

  const groupedAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];

    const grouped = transactions.reduce((groups, transaction) => {
      const date = moment(transaction.executedAt).format('YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => moment(dateB).diff(moment(dateA)))
      .map(([date, transactions]) => ({
        date,
        transactions: transactions.sort((a, b) =>
          moment(b.executedAt).diff(moment(a.executedAt)),
        ),
      }));
  }, [transactions]);

  return (
    <section className="container p-4 mx-auto pb-20 md:pb-4">
      <div className="flex flex-row items-center">
        <h1 className="text-2xl font-bold">Transactions List</h1>
        <ListFilters data={filters} onChange={setFilter} />
      </div>

      <div className="flex-grow overflow-hidden flex flex-col">
        {isLoading && (
          <ul className="space-y-2">
            {[...Array(perPage)].map((_, index) => (
              <li key={index}><TransactionListItemSkeletonV3 /></li>
            ))}
          </ul>
        )}

        {isError && (
          <div className="p-4 mb-4 text-sm rounded-lg bg-destructive/10 text-destructive">
            <p className="font-medium">Error:</p>
            <p>{error?.message || 'An unexpected error occurred.'}</p>
          </div>
        )}

        {(!isLoading && !isError && transactions) && (
          <>
            {groupedAndSortedTransactions.length > 0 && (
              <>
                {groupedAndSortedTransactions.map(({ date, transactions }) => (
                  <div key={date} className="mb-6">
                    <h5 className="text-lg font-semibold mb-2">{formatTransactionDate(date)}</h5>
                    <ul className="space-y-2">
                      {transactions.map((transaction: Transaction) => (
                        <li key={transaction.id}>
                          <TransactionListItemV3 transaction={transaction} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="mt-4">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              </>
            )}
            {groupedAndSortedTransactions.length === 0 &&
              <EmptyTransactionState onRefresh={refetch} onAddTransaction={() => openForm(FormType.Transaction)} />}
          </>
        )}

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
