import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import cn from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSwipeable } from 'react-swipeable';

import { useScreenSize } from '@/hooks/useScreenSize';
import YearDoughnutTimeframeDisplayChart from '@/components/common/YearDoughnutTimeframeDisplayChart';
import DateCard, { DateCardSkeleton } from '@/components/features/daily-ledger/DateCard';
import { Button } from '@/components/ui/button';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { useTransactionsAndTransfers } from '@/hooks/useTransactionsAndTransfers';

export const DailyLedgerPage = () => {
  const [currentDate, setCurrentDate] = useState(moment().startOf('day'));
  const isDesktop = useScreenSize();
  const daysPerPage = 5;

  const dateRange = useMemo(() => {
    const startDate = currentDate.clone().subtract(daysPerPage - 1, 'days');
    const endDate = currentDate.clone();
    return { startDate, endDate };
  }, [currentDate]);

  const {
    groupedItems,
    isLoading,
    isError,
    error,
    setFilter,
  } = useTransactionsAndTransfers({
    updateUrl: false,
    excludeTransfers: true,
  });

  useEffect(() => {
    setFilter('after', dateRange.startDate);
    setFilter('before', dateRange.endDate.clone().endOf('day'));
  }, [dateRange, setFilter]);

  const goToNextPage = useCallback(() => {
    setCurrentDate(prev => prev.clone().add(daysPerPage, 'days'));
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentDate(prev => prev.clone().subtract(daysPerPage, 'days'));
  }, []);

  useHotkeys('arrowleft', goToPreviousPage);
  useHotkeys('arrowright', goToNextPage);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNextPage,
    onSwipedRight: goToPreviousPage,
    trackMouse: true,
  });

  const formatDateRange = (startDate: moment.Moment, endDate: moment.Moment) => {
    if (startDate.isSame(endDate, 'month')) {
      return `${startDate.format('MMM D')}-${endDate.format('D, YYYY')}`;
    } else if (startDate.isSame(endDate, 'year')) {
      return `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
    } else {
      return `${startDate.format('MMM D, YYYY')} - ${endDate.format('MMM D, YYYY')}`;
    }
  };

  const dates = useMemo(() => Array.from({ length: daysPerPage }, (_, i) => moment(currentDate).subtract(i, 'days')), [currentDate, daysPerPage]);

  return (
    <section className="w-full mx-auto md:px-4 pb-16 pt-4 md:py-4" {...swipeHandlers}>
      <h1 className="hidden sm:block text-2xl font-bold mb-4">Daily Ledger</h1>

      <div className="flex justify-between items-center mb-4">
        <Button onClick={goToPreviousPage} disabled={isLoading} size="sm" variant="ghost">
          <ChevronLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline"> Previous</span>
        </Button>
        <ResponsiveTooltip
          openDelay={1}
          desktopComponent="hovercard"
          contentClassName="w-full max-w-sm p-4 sm:w-96 bg-transparent border-none shadow-none"
          triggerClassName="cursor-help"
          content={
            <span>
              <YearDoughnutTimeframeDisplayChart data={[{ after: dateRange.startDate, before: dateRange.endDate }]} />
            </span>
          }
        >
          <span className="text-lg font-medium">{formatDateRange(dateRange.startDate, dateRange.endDate)}</span>
        </ResponsiveTooltip>
        <Button onClick={goToNextPage} disabled={isLoading} size="sm" variant="ghost">
          <span className="hidden sm:inline">Next </span>
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {isError && (
        <div className="p-4 mb-4 text-sm rounded-lg bg-destructive/10 text-destructive" role="alert">
          <p className="font-medium">Error:</p>
          <p>{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row-reverse md:-mx-2 mb-6">
        {dates.map((date, index) => (
          <React.Fragment key={date.format('YYYY-MM-DD')}>
            <div
              className={cn('w-full', 'px-0', 'md:px-2', {
                'md:w-1/5': isDesktop
              })}
              style={{
                order: `${daysPerPage - index - 1} sm:${index}`,
              }}>
              {isLoading ? (
                <DateCardSkeleton index={index} totalDays={dates.length} />
              ) : (
                <DateCard
                  date={date}
                  items={groupedItems[date.format('YYYY-MM-DD')] || []}
                  index={index}
                  totalDays={dates.length}
                />
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default DailyLedgerPage;
