import { useEffect, useState } from 'react';

import { TransactionListItem } from '@/app/transactions/transaction-list-item.tsx';
import { PaginationComponent as Pagination } from '@/components/pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListState, useListState } from '@/hooks/list-state.tsx';
import { Transaction } from '@/models/transaction.ts';
import { generateTransactions } from '@/services/transactions-generator.ts';

interface TransactionFilters {
  searchTerm: string;
  dateRange: string;
  status: string;
}

const fetchTransactions = async (listState: ListState<TransactionFilters, Transaction>): Promise<{
  data: Transaction[];
  totalPages: number
}> => {
  // This is where you'd make your actual API call
  // For now, we'll simulate it
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(listState);

  const { pagination: { currentPage, pageSize }, filters, sort } = listState;

  // Simulate filtering (in a real scenario, this would be done on the server)
  let data = generateTransactions(pageSize);

  if (filters.searchTerm) {
    data = data.filter(t => t.amount.toFixed(2).includes(filters.searchTerm));
  }

  // Simulate total pages calculation
  const totalPages = 10;

  return { data, totalPages };
};

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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const { data, totalPages } = await fetchTransactions(listState);
        setTransactions(data);
        setTotalPages(totalPages);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        // Handle error (e.g., show error message to user)
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [currentPage, pageSize, filters, sort]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transactions List</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search transactions"
          value={filters.searchTerm}
          onChange={value => setFilter('searchTerm', value)}
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
      {loading ? (
        <p>Loading transactions...</p>
      ) : (
        <ul className="space-y-2">
          {transactions.map((transaction: Transaction) => (
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
