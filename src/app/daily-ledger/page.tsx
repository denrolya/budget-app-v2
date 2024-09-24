import { useQueries } from '@tanstack/react-query';
import moment from 'moment';
import React, { useMemo } from 'react';

import TransactionListItem from '@/components/features/transactions/ListItemV2';
import TransferListItem from '@/components/features/transfers/ListItem';
import { Pagination } from '@/components/ui/pagination';
import { useListState } from '@/hooks/useListState.tsx';
import Transaction, { TransactionFactory } from '@/models/Transaction';
import Transfer from '@/models/Transfer';
import { api } from '@/services/api';

const BACKEND_DATE_FORMAT = 'YYYY-MM-DD';
const RECENT_THRESHOLD_DAYS = 7;

export const CombinedList: React.FC = () => {
  const { createTransaction } = TransactionFactory();

  const {
    pagination: { currentPage, perPage, totalPages },
    filters,
    sort,
    setCurrentPage,
    setFilter,
    setSort,
    setTotalPages,
  } = useListState({
    initialPerPage: 50000,
    initialFilters: {},
    initialSort: { field: 'executedAt', direction: 'desc' },
    searchParamKeys: {
      searchTerm: 'q',
      before: 'before',
      after: 'after',
      amountRange: 'amount',
      accounts: 'accounts',
    },
    formatMoment: BACKEND_DATE_FORMAT,
    updateUrl: true,
  });

  const createUrl = (endpoint: string) => {
    const query = new URLSearchParams();
    query.set('perPage', perPage.toString());
    query.set('page', currentPage.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((item) => query.append(`${key}[]`, item.toString()));
        } else if (typeof value === 'boolean') {
          query.set(key, value ? '1' : '0');
        } else if (moment.isMoment(value)) {
            query.set(endpoint === '/api/transfers' ? `executedAt[${key}]` : key, value.format(BACKEND_DATE_FORMAT));
        } else {
          query.set(key, value.toString());
        }
      }
    });

    if (sort.field) query.set('sortField', sort.field as string);
    if (sort.direction) query.set('sortDirection', sort.direction);

    return `${endpoint}?${query.toString()}`;
  };

  const queries = useQueries({
    queries: [
      {
        queryKey: ['transactions', filters, currentPage, perPage, sort],
        queryFn: () => api(createUrl('/api/v2/transaction')),
        select: (data: any) => ({
          ...data.data,
          list: data.data.list.map((t: any) => createTransaction(t)),
        }),
      },
      {
        queryKey: ['transfers', filters, currentPage, perPage, sort],
        queryFn: () => api(createUrl('/api/transfers')),
        select: (data: any) => ({
          ...data.data,
          list: data.data['hydra:member'].map((t: any) => new Transfer({
            ...t,
            transactions: t.transactions.map(createTransaction),
          })),
          count: data.data['hydra:totalItems'],
        }),
      },
    ],
  });

  const [transactionsQuery, transfersQuery] = queries;

  const combinedData = useMemo(() => {
    if (!transactionsQuery.data || !transfersQuery.data) return [];

    const combined = [
      ...transactionsQuery.data.list,
      ...transfersQuery.data.list,
    ];

    return combined.sort((a, b) => b.executedAt.diff(a.executedAt));
  }, [transactionsQuery.data, transfersQuery.data]);

  const groupedAndSortedItems = useMemo(() => {
    if (!combinedData.length) return [];

    const grouped = combinedData.reduce((groups, item) => {
      const date = item.executedAt.format('YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {} as Record<string, (Transaction | Transfer)[]>);

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => moment(dateB).diff(moment(dateA)))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => b.executedAt.diff(a.executedAt)),
      }));
  }, [combinedData]);

  const formatItemDate = (dateString: string): string => {
    const itemDate = moment(dateString);
    const now = moment();
    const diffInDays = now.diff(itemDate, 'day');
    const formattedDate = itemDate.format('MMM D, YYYY');

    if (diffInDays < RECENT_THRESHOLD_DAYS) {
      const relativeTime = itemDate.fromNow();
      return `${relativeTime} (${formattedDate})`;
    } else {
      return formattedDate;
    }
  };

  const isLoading = transactionsQuery.isLoading || transfersQuery.isLoading;
  const isError = transactionsQuery.isError || transfersQuery.isError;
  const error = transactionsQuery.error || transfersQuery.error;

  return (
    <section className="container p-4 mx-auto pb-20 md:pb-4">
      <div className="flex flex-row">
        <h1 className="text-2xl font-bold">Combined Transactions and Transfers</h1>
      </div>

      <div className="flex-grow overflow-hidden flex flex-col">
        {isLoading && (
          <ul className="space-y-2">
            {[...Array(perPage)].map((_, index) => (
              <li key={index}>Loading</li>
            ))}
          </ul>
        )}

        {isError && (
          <div className="p-4 mb-4 text-sm rounded-lg bg-destructive/10 text-destructive">
            <p className="font-medium">Error:</p>
            <p>{error?.message || 'An unexpected error occurred.'}</p>
          </div>
        )}

        {(!isLoading && !isError && combinedData.length > 0) && (
          <>
            {groupedAndSortedItems.map(({ date, items }) => (
              <div key={date} className="mb-6">
                <h5 className="text-lg font-semibold mb-2">{formatItemDate(date)}</h5>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      {item instanceof Transaction ? (
                        <TransactionListItem transaction={item} />
                      ) : (
                        <TransferListItem transfer={item} />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}

        {(!isLoading && !isError && combinedData.length === 0) && (
          <span> error </span>
        )}

        {((transactionsQuery.isFetching || transfersQuery.isFetching) && !isLoading) && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded">
            Updating...
          </div>
        )}
      </div>
    </section>
  );
};

export default CombinedList;
