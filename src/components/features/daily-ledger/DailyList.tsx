import moment, { Moment } from 'moment';
import cn from 'classnames';
import React, { useMemo } from 'react';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime.ts';
import DateCard, { DateCardSkeleton } from '@/components/features/daily-ledger/DateCard';
import { useScreenSize } from '@/hooks/useScreenSize';
import Transaction from '@/models/Transaction';
import Transfer from '@/models/Transfer';

interface Props {
  isLoading: boolean;
  daysPerPage: number;
  groupedItems: [Moment, (Transaction | Transfer)[], number, number, number, number][];
  currentDate: Moment;
}

const DailyList: React.FC<Props> = ({ isLoading, daysPerPage, groupedItems, currentDate }) => {
  const isDesktop = useScreenSize();
  const dates = useMemo(() => Array.from({ length: daysPerPage }, (_, i) => moment(currentDate).subtract(i, 'days')), [currentDate, daysPerPage]);

  return (
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
  );
};

export default DailyList;
