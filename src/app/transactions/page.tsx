import isEqual from 'lodash/isEqual';
import moment from 'moment';
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAccounts } from '@/contexts/FinanceData';
import { Pagination } from '@/components/common/Pagination';
import ListFilters from '@/components/features/transactions/ListFilters';
import { ListItemSkeleton as TransactionListItemSkeleton } from '@/components/features/transactions/ListItemSkeleton';
import TransactionListItemV1 from '@/components/features/transactions/ListItem';
import TransactionListItemV2 from '@/components/features/transactions/ListItemV2';
import { Button } from '@/components/ui/button';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { FormType, useForm, useFormSubmitListener } from '@/contexts/Form';
import { useListState } from '@/hooks/useListState';
import { Transaction } from '@/models/transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import { axiosFetcher } from '@/services/api';

const defaultFilters = new TransactionFilters();

export const TransactionsList: React.FC = () => {
  const { openForm } = useForm();
  const accounts = useAccounts();
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
          query.set(key, value.join(','));
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

  const { data, error, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['transactions', url],
    queryFn: async () => {
      const result = await axiosFetcher(url);
      return {
        ...result,
        list: result.list.map((t: never) => {
          const account = accounts.find((a) => a.id === t.account.id);
          return new Transaction({ ...t, account });
        }),
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Transactions List <Button onClick={() => openForm(FormType.Transaction)}>Create new Transaction</Button>
        <Button onClick={() => setListStyle(listStyle === 'v1' ? 'v2' : 'v1')} className="ml-2">
          Switch to {listStyle === 'v1' ? 'v2' : 'v1'} style
        </Button>
      </h1>

      <ListFilters data={filters} onChange={setFilter} className="mb-6" />


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
        <ul className="space-y-2">
          {data.list.map((transaction: Transaction) => (
            <li key={transaction.id}>
              <TransactionListItem transaction={transaction} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {(isFetching && !isPending) && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded">
          Updating...
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
