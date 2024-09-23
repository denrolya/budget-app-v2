import { useQuery, useQueryClient } from '@tanstack/react-query';
import isEqual from 'lodash/isEqual';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Pagination } from '@/components/common/Pagination';
import EmptyTransactionState from '@/components/features/transactions/EmptyTransactionState.tsx';
import ListFilters from '@/components/features/transactions/ListFilters';
import TransactionListItemV1 from '@/components/features/transactions/ListItem';
import TransactionListItemV2, {
  ListItemSkeleton as TransactionListItemSkeleton,
} from '@/components/features/transactions/ListItemV2';
import { Button } from '@/components/ui/button';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext, useFormSubmitListener } from '@/contexts/Form';
import { useListState } from '@/hooks/useListState';
import Transaction, { TransactionFactory } from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import { axiosFetcher } from '@/services/api';

const defaultFilters = new TransactionFilters();

interface TransformedResponse {
  list: Transaction[];
}

export const TransactionsList: React.FC = () => {
  const { createTransaction } = TransactionFactory();
  const { openForm } = useFormContext();
  const queryClient = useQueryClient();
  const [listStyle, setListStyle] = useState<'v1' | 'v2'>('v2');
  const {
    pagination: { currentPage, pageSize, totalPages },
    filters,
    sort,
    setCurrentPage,
    setFilter,
    setSort,
    setTotalPages,
  } = useListState<TransactionFilters, Transaction>({
    initialPageSize: 10,
    initialFilters: defaultFilters,
    initialSort: { field: 'executedAt', direction: 'desc' },
    searchParamKeys: {
      searchTerm: 'q',
      before: 'before',
      after: 'after',
      status: 'status',
      amountRange: 'amount',
      categories: 'categories',
      accounts: 'accounts',
      withNestedCategories: 'withNestedCategories',
      isDraft: 'isDraft',
    },
    formatMoment: BACKEND_DATE_FORMAT,
    updateUrl: true,
  });

  const url = useMemo(() => {
    const query = new URLSearchParams();

    const addParam = (key: string, value: unknown, defaultValue: unknown) => {
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      const isEmptyValue = value === undefined || value === null || value === '';

      if (!isEmptyValue && !isEmptyArray && !isEqual(value, defaultValue)) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            query.append(`${key}[]`, item.toString());
          });
        } else if (typeof value === 'boolean') {
          query.set(key, value ? '1' : '0');
        } else if (moment.isMoment(value)) {
          query.set(key, value.format(BACKEND_DATE_FORMAT));
        } else {
          query.set(key, value.toString());
        }
      }
    };

    query.set('perPage', pageSize.toString());
    query.set('page', currentPage.toString());

    Object.entries(filters).forEach(([key, value]) => {
      addParam(key, value, defaultFilters[key as keyof TransactionFilters]);
    });

    if (sort.field) query.set('sortField', sort.field as string);
    if (sort.direction) query.set('sortDirection', sort.direction);

    return `/api/v2/transaction?${query.toString()}`;
  }, [filters, currentPage, pageSize, sort]);

  const { data, error, isPending, isError, isFetching, refetch } = useQuery<TransformedResponse, Error>({
    queryKey: ['transactions', url],
    queryFn: async (): Promise<TransformedResponse> => {
      const result = await axiosFetcher(url);
      return {
        ...result,
        list: result.list.map((t: never) => createTransaction(t)),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    if (isError) {
      setTotalPages(0);
      toast.error('Failed to fetch transactions', {
        description: error?.message || 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => refetch(),
        },
      });
    } else if (data) {
      setTotalPages(Math.ceil(data.count / pageSize) || 0);
    }
  }, [isError, data, pageSize, setTotalPages]);

  const handleFormSubmit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, [queryClient]);

  useFormSubmitListener([FormType.Transaction, FormType.Transfer], handleFormSubmit);

  const TransactionListItem = useMemo(() => listStyle === 'v1' ? TransactionListItemV1 : TransactionListItemV2, [listStyle]);

  const groupedAndSortedTransactions = useMemo(() => {
    const transactions = data?.list;

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
  }, [data?.list]);

  const RECENT_THRESHOLD_DAYS = 7;

  const formatTransactionDate = (dateString: string): string => {
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

  return (
    <section className="container p-4 mx-auto pb-20 md:pb-4">
      <div className="flex flex-row">
        <h1 className="text-2xl font-bold">Transactions List</h1>
        <Button variant="ghost"
                size="icon"
                className="p-0 ml-2"
                onClick={() => setListStyle(listStyle === 'v1' ? 'v2' : 'v1')}>
          {listStyle === 'v1' ? 'v2' : 'v1'}
        </Button>
        <ListFilters data={filters} onChange={setFilter} />
      </div>

      <div className="flex-grow overflow-hidden flex flex-col">
        {isPending && (
          <ul className="space-y-2">
            {[...Array(pageSize)].map((_, index) => (
              <li key={index}><TransactionListItemSkeleton /></li>
            ))}
          </ul>
        )}

        {isError && (
          <div className="p-4 mb-4 text-sm rounded-lg bg-destructive/10 text-destructive">
            <p className="font-medium">Error:</p>
            <p>{error?.message || 'An unexpected error occurred.'}</p>
          </div>
        )}

        {(!isPending && !isError && data) && (
          <>
            {groupedAndSortedTransactions.length > 0 && (
              <>
                {groupedAndSortedTransactions.map(({ date, transactions }) => (
                    <div key={date} className="mb-6">
                      <h5 className="text-lg font-semibold mb-2">{formatTransactionDate(date)}</h5>
                      <ul className="space-y-2">
                        {transactions.map((transaction: Transaction) => (
                          <li key={transaction.id}>
                            <TransactionListItem transaction={transaction} />
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

        {(isFetching && !isPending) && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded">
            Updating...
          </div>
        )}
      </div>
    </section>
  );
};

export default TransactionsList;
