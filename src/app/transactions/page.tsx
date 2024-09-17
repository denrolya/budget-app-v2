import isEqual from 'lodash/isEqual';
import moment from 'moment';
import { FC, useCallback, useMemo } from 'react';
import useSWR from 'swr';

import { Pagination } from '@/components/common/Pagination';
import ListFilters from '@/components/features/transactions/ListFilters';
import { ListItemSkeleton as TransactionListItemSkeleton } from '@/components/features/transactions/ListItemSkeleton';
import TransactionListItem from '@/components/features/transactions/ListItemV2';
import { Button } from '@/components/ui/button';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { FormType, useForm, useFormSubmitListener } from '@/contexts/Form';
import { useListState } from '@/hooks/useListState';
import { Transaction } from '@/models/transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import { axiosFetcher } from '@/services/api';

const defaultFilters = new TransactionFilters();

export const TransactionsList: FC = () => {
  const { openForm } = useForm();
  const {
    pagination: { currentPage, pageSize },
    filters,
    sort,
    setCurrentPage,
    setFilter,
    setSort,
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
          query.set(key, value ? 1 : 0);
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

  const { data, error, isLoading, mutate } = useSWR(url, async (url) => {
    const result = await axiosFetcher(url);
    return {
      ...result,
      list: result.list.map((t: never) => new Transaction(t)),
    };
  });

  const handleFormSubmit = useCallback(response => {
    mutate();
  }, [mutate]);

  useFormSubmitListener([FormType.Transaction, FormType.Transfer], handleFormSubmit);

  const totalPages = useMemo(() => Math.ceil(data?.count / pageSize) || 0, [data, pageSize]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transactions List <Button onClick={() => openForm('transaction')}>Create new Transaction</Button></h1>

      <ListFilters data={filters} onChange={setFilter} className="mb-6" />

      {isLoading && (
        <ul className="space-y-2">
          {[...Array(pageSize)].map((_, index) => (
            <li key={index}><TransactionListItemSkeleton /></li>
          ))}
        </ul>
      )}

      {!isLoading && (
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
    </div>
  );
};

export default TransactionsList;
