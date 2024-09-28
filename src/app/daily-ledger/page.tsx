import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { useCategories } from '@/contexts/FinanceData';
import TransactionListItem from '@/components/features/transactions/ListItemV3';
import TransferListItem from '@/components/features/transfers/ListItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransfers } from '@/hooks/useTransfers';
import Transaction from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import Transfer from '@/models/Transfer';
import { TransferFilters } from '@/models/TransferFilters';

const DailyLedger: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(moment().startOf('day'));
  const daysPerPage = 3;
  const { list:categories } = useCategories();
  const transferCategories = useMemo(() => categories.filter(c => c.name === 'Transfer').map(({ id }) => id), [categories.length]);

  const dateRange = useMemo(() => {
    const startDate = currentDate.clone().subtract(daysPerPage - 1, 'days');
    const endDate = currentDate.clone();
    return { startDate, endDate };
  }, [currentDate]);

  const {
    transactions,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
    error: errorTransactions,
    setFilter: setTransactionFilter,
  } = useTransactions({
    initialFilters: new TransactionFilters({
      excludedCategories: transferCategories,
    }),
    updateUrl: false,
  });

  const {
    transfers,
    isLoading: isLoadingTransfers,
    isError: isErrorTransfers,
    error: errorTransfers,
    setFilter: setTransferFilter,
  } = useTransfers({
    initialFilters: new TransferFilters(),
    updateUrl: false,
  });

  useEffect(() => {
    setTransactionFilter('after', dateRange.startDate);
    setTransactionFilter('before', dateRange.endDate.clone().endOf('day'));
    setTransferFilter('after', dateRange.startDate);
    setTransferFilter('before', dateRange.endDate.clone().endOf('day'));
  }, [dateRange, setTransactionFilter, setTransferFilter]);

  const isLoading = isLoadingTransactions || isLoadingTransfers;
  const isError = isErrorTransactions || isErrorTransfers;
  const error = errorTransactions || errorTransfers;

  const combinedItems = useMemo(() => {
    const items = [
      ...transactions,
      ...transfers,
    ];
    return items.sort((a, b) => b.executedAt.diff(a.executedAt));
  }, [transactions, transfers]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: (Transaction | Transfer)[] } = {};
    combinedItems.forEach(item => {
      const dateKey = item.executedAt.format('YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  }, [combinedItems]);

  const goToNextPage = useCallback(() => {
    setCurrentDate(prev => prev.clone().add(daysPerPage, 'days'));
  }, [daysPerPage]);

  const goToPreviousPage = useCallback(() => {
    setCurrentDate(prev => prev.clone().subtract(daysPerPage, 'days'));
  }, [daysPerPage]);
  useHotkeys('arrowleft', goToPreviousPage);
  useHotkeys('arrowright', goToNextPage);

  const formatDateRange = (startDate: moment.Moment, endDate: moment.Moment) => {
    if (startDate.isSame(endDate, 'month')) {
      return `${startDate.format('MMM D')}-${endDate.format('D, YYYY')}`;
    } else if (startDate.isSame(endDate, 'year')) {
      return `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
    } else {
      return `${startDate.format('MMM D, YYYY')} - ${endDate.format('MMM D, YYYY')}`;
    }
  };

  return (
    <section className="container mx-auto p-4 pb-16">
      <h1 className="text-2xl font-bold mb-4">Daily Ledger</h1>

      <div className="flex justify-between items-center mb-4">
        <Button onClick={goToPreviousPage} disabled={isLoading} size="sm" variant="ghost">
          <ChevronLeft className="mr-2 h-4 w-4" /><span className="hidden md:inline"> Previous</span>
        </Button>
        <span className="text-lg font-medium">
          {formatDateRange(dateRange.startDate, dateRange.endDate)}
        </span>
        <Button onClick={goToNextPage} disabled={isLoading} size="sm" variant="ghost">
          <span className="hidden md:inline">Next </span><ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {isLoading && <p>Loading...</p>}

      {isError && (
        <div className="p-4 mb-4 text-sm rounded-lg bg-destructive/10 text-destructive">
          <p className="font-medium">Error:</p>
          <p>{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: daysPerPage }, (_, i) => moment(currentDate).subtract(i, 'days')).reverse().map(date => {
            const dateKey = date.format('YYYY-MM-DD');
            const items = groupedItems[dateKey] || [];

            return (
              <Card key={dateKey} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{date.format('ddd, MMM D')}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-auto">
                  {items.length > 0 ? (
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
                  ) : (
                    <p className="text-center text-muted-foreground">No entries for this day</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default React.memo(DailyLedger);
