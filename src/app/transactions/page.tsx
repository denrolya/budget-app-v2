import { useMemo } from 'react';
import useSWR from 'swr';

import { Pagination } from '@/components/common/Pagination';
import { ListItem as TransactionListItem } from '@/components/features/transactions/ListItem';
import { ListItemSkeleton as TransactionListItemSkeleton } from '@/components/features/transactions/ListItemSkeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useListState } from '@/hooks/useListState.tsx';
import { Transaction } from '@/models/transaction.ts';
import { axiosFetcher } from '@/services/api';

interface TransactionFilters {
  searchTerm: string;
  dateRange: string;
  status: string;
}

export const TransactionsList = () => {
  const listState = useListState<TransactionFilters, Transaction>({
    initialPageSize: 10,
    initialFilters: {
      searchTerm: '',
      dateRange: '',
      status: '',
    },
    initialSort: { field: 'executedAt', direction: 'desc' },
    searchParamKeys: {
      searchTerm: 'search',
      dateRange: 'executedAt',
      status: 'status',
    },
  });

  const {
    pagination: { currentPage, pageSize },
    filters,
    sort,
    setCurrentPage,
    setFilter,
    setSort,
  } = listState;

  const url = useMemo(() => {
    const query = new URLSearchParams({
      perPage: pageSize,
      page: currentPage,
    }).toString();
    return `/api/v2/transaction?${query}`;
  }, [filters, currentPage, pageSize]);

  const { data, error, isLoading } = useSWR(url, async (url) => {
    const result = await axiosFetcher(url);
    return {
      ...result,
      list: result.list.map((t: never) => new Transaction(t)),
    };
  });

  const totalPages = useMemo(() => Math.ceil(data?.count / pageSize) || 0, [data, pageSize]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transactions List</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search transactions"
          value={filters.searchTerm}
          onChange={e => setFilter('searchTerm', e.target.value)}
          className="max-w-sm"
        />
        <Select value={filters.dateRange} onValueChange={value => setFilter('dateRange', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="thisWeek">This Week</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="thisYear">This Year</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={value => setFilter('status', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
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

      {/* Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default TransactionsList;
