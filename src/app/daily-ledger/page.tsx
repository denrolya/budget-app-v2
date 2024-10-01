import cn from 'classnames';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import DateCard, { DateCardSkeleton } from '@/components/features/daily-ledger/DateCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransfers } from '@/hooks/useTransfers';
import Transaction from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import Transfer from '@/models/Transfer';
import { TransferFilters } from '@/models/TransferFilters';


export const DailyLedgerPage = () => {
  const [currentDate, setCurrentDate] = useState(moment().startOf('day'));
  const daysPerPage = 5;

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
    initialFilters: new TransactionFilters(),
    updateUrl: false,
    excludeTransfers: true,
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
    const items = [...transactions, ...transfers];
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

  const dates = Array.from({ length: daysPerPage }, (_, i) => moment(currentDate).subtract(i, 'days'));

  return (
    <section className="w-full mx-auto p-4 pb-16">
      <h1 className="text-2xl font-bold mb-4">Daily Ledger</h1>

      <div className="flex justify-between items-center mb-4">
        <Button onClick={goToPreviousPage} disabled={isLoading} size="sm" variant="ghost">
          <ChevronLeft className="mr-2 h-4 w-4" />
          <span className="hidden md:inline"> Previous</span>
        </Button>
        <span className="text-lg font-medium">{formatDateRange(dateRange.startDate, dateRange.endDate)}</span>
        <Button onClick={goToNextPage} disabled={isLoading} size="sm" variant="ghost">
          <span className="hidden md:inline">Next </span>
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {isError && (
        <div className="p-4 mb-4 text-sm rounded-lg bg-destructive/10 text-destructive" role="alert">
          <p className="font-medium">Error:</p>
          <p>{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:-mx-2 mb-6">
        {dates.map((date, index) => (
          <React.Fragment key={date.format('YYYY-MM-DD')}>
            <div
              className={cn('w-full md:w-1/5 md:px-2', {
                'order-first md:order-last': index === 0,
                'order-last md:order-first': index === dates.length - 1,
              })}
            >
              {isLoading && (
                <DateCardSkeleton index={index} totalDays={dates.length} />
              )}
              {!isLoading && (
                <DateCard
                  date={date}
                  items={groupedItems[date.format('YYYY-MM-DD')] || []}
                  index={index}
                  totalDays={dates.length}
                />
              )}
            </div>
            {index < dates.length - 1 && <Separator className="md:hidden my-6" />}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default DailyLedgerPage;
