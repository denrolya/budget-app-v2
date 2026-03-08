import { Moment } from 'moment';
import React, { useMemo } from 'react';

import DateCard, { DateCardSkeleton } from '@/features/daily-ledger/components/DateCard';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useIsMobile } from '@/hooks/use-mobile';
import { Transaction } from '@/features/transactions';
import { Transfer } from '@/features/transfers';

interface Props {
  isLoading: boolean;
  groupedItems: [Moment, (Transaction | Transfer)[], number, number, number, number][];
  after: Moment;
  before: Moment;
  reversed?: boolean;
}

const DESKTOP_COL_W = 'w-[420px]';

const DailyList: React.FC<Props> = ({ isLoading, groupedItems, after, before, reversed }) => {
  const isMobile = useIsMobile();

  const dates = useMemo(() => {
    const out: Moment[] = [];
    const d = after.clone();
    while (d.isSameOrBefore(before, 'day')) {
      out.push(d.clone());
      d.add(1, 'day');
    }
    return out;
  }, [after, before]);

  const orderedDates = useMemo(() => {
    const arr = [...dates];
    if (reversed) arr.reverse();
    return arr;
  }, [dates, reversed]);

  return (
    <div className="h-full w-full min-w-0">
      {!isMobile && (
        <div className="flex h-full min-w-max gap-3 px-4 py-3">
          {orderedDates.map((date) => {
            const group = groupedItems?.find((g) => g[0].isSame(date, 'day'));
            const items = group ? group[1] : [];

            return (
              <div className={`shrink-0 ${DESKTOP_COL_W} h-full`} key={date.format(BACKEND_DATE_FORMAT)}>
                {isLoading && <DateCardSkeleton />}
                {!isLoading && <DateCard date={date} items={items} />}
              </div>
            );
          })}
        </div>
      )}

      {isMobile && (
        <div className="flex flex-col gap-3 px-2 py-2">
          {orderedDates.map((date) => {
            const group = groupedItems?.find((g) => g[0].isSame(date, 'day'));
            const items = group ? group[1] : [];

            return (
              <div className="w-full" key={date.format(BACKEND_DATE_FORMAT)}>
                {isLoading && <DateCardSkeleton />}
                {!isLoading && <DateCard date={date} items={items} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DailyList;
