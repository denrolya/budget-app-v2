import cn from 'classnames';
import { Moment } from 'moment';
import React, { useMemo } from 'react';

import { useIsMobile } from '@/hooks/useMobile';
import DateCard, { DateCardSkeleton } from '@/components/features/daily-ledger/DateCard';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';

interface Props {
  isLoading: boolean;
  groupedItems: [Moment, (Transaction | Transfer)[], number, number, number, number][];
  after: Moment;
  before: Moment;
}

const DailyList: React.FC<Props> = ({ isLoading, groupedItems, after, before }) => {
  const isMobile = useIsMobile();

  const dates = useMemo(() => {
    const dates = [];
    const currentDate = after.clone();
    while (currentDate.isSameOrBefore(before)) {
      dates.push(currentDate.clone());
      currentDate.add(1, 'day');
    }
    return dates;
  }, [after, before]);

  const totalDays = dates.length;

  // Sort dates in descending order for mobile view
  const sortedDates = useMemo(() => [...dates].sort((a, b) => b.valueOf() - a.valueOf()), [dates]);

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:-mx-2 mb-6',
        { 'md:flex-row-reverse': isMobile }, // Reverse order for desktop view
      )}
    >
      {(!isMobile ? dates : sortedDates).map((date, index) => {
        const foundGroup = groupedItems?.find((group) => group[0].isSame(date, 'day'));

        return (
          <React.Fragment key={date.format(BACKEND_DATE_FORMAT)}>
            <div
              className={cn('w-full px-0 md:px-2', {
                'md:w-1/7': !isMobile,
              })}
            >
              {isLoading && <DateCardSkeleton index={index} totalDays={totalDays} />}
              {!isLoading && (
                <DateCard date={date} items={foundGroup ? foundGroup[1] : []} index={index} totalDays={totalDays} />
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default DailyList;
