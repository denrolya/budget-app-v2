import cn from 'classnames';
import { ArrowRightLeftIcon, CalendarIcon, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSwipeable } from 'react-swipeable';

import MoneyValue from '@/components/common/MoneyValue.tsx';
import YearDoughnutTimeframeDisplayChart from '@/components/common/YearDoughnutTimeframeDisplayChart';
import DateCard, { DateCardSkeleton } from '@/components/features/daily-ledger/DateCard';
import { Button } from '@/components/ui/button';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime.ts';
import { useScreenSize } from '@/hooks/useScreenSize';
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


  const summary = useMemo(() => {
    if (!groupedItems) return {
      transactionsCount: 0,
      transfersCount: 0,
      transactionsValue: 0,
      transfersValue: 0,
    };

    let transactionsCount = 0;
    let transfersCount = 0;
    let transfersValue = 0;
    let transactionsValue = 0;

    groupedItems.forEach(([, , groupTransactionsValue, groupTransfersValue, groupTransactionsCount, groupTransfersCount]) => {
      transactionsCount += groupTransactionsCount;
      transfersCount += groupTransfersCount;
      transactionsValue += groupTransactionsValue;
      transfersValue += groupTransfersValue;
    });

    return { transactionsCount, transfersCount, transactionsValue, transfersValue };
  }, [groupedItems]);

  return (
    <section className="w-full mx-auto md:px-4 pb-16 pt-4 md:py-4" {...swipeHandlers}>
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
            <YearDoughnutTimeframeDisplayChart data={[{ after: dateRange.startDate, before: dateRange.endDate }]} />
          }
        >
          <span>
          <h4 className="text-lg font-semibold flex items-center justify-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
            {formatDateRange(dateRange.startDate, dateRange.endDate)}
          </h4>
          <div className="flex flex-wrap gap-1 text-sm justify-center">
            <div className="flex items-center min-w-[120px]">
              <ArrowRightLeftIcon className="mr-1 h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium mr-1">{summary.transfersCount}</span>
              <span className="text-muted-foreground truncate">
              (<MoneyValue useColors={false} amount={summary.transfersValue} />)
            </span>
            </div>
            <div className="flex items-center min-w-[120px]">
              <Receipt className="mr-1 h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium mr-1">{summary.transactionsCount}</span>
              <span className="text-muted-foreground truncate">
              (<MoneyValue amount={summary.transactionsValue} />)
            </span>
            </div>
          </div>
            </span>
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
        {dates.map((date, index) => {
          const foundGroup = groupedItems?.find((group) => group[0].isSame(date, 'day'));

          return (
            <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
              <div
                className={cn('w-full', 'px-0', 'md:px-2', {
                  'md:w-1/5': isDesktop,
                })}
                style={{
                  order: `${daysPerPage - index - 1} sm:${index}`,
                }}
              >
                {isLoading && (
                  <DateCardSkeleton index={index} totalDays={daysPerPage} />
                )}
                {!isLoading && (
                  <DateCard
                    date={date}
                    items={foundGroup ? foundGroup[1] : []}
                    index={index}
                    totalDays={daysPerPage}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};

export default DailyLedgerPage;
