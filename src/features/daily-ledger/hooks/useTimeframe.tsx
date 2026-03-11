import moment from 'moment';
import { useCallback, useState } from 'react';

import { Timeframe } from '@/types/global';

export const getInitialTimeframe = (): Timeframe => ({
  after: moment().startOf('month'),
  before: moment().endOf('month'),
});

export type DetectedPeriod = 'day' | 'week' | 'month' | 'custom';

/** Detects whether a timeframe aligns with a standard period boundary. */
export const detectPeriod = ({ after, before }: Timeframe): DetectedPeriod => {
  if (after.isSame(before, 'day')) return 'day';

  if (after.isoWeekday() === 1 && before.isoWeekday() === 7 && before.diff(after, 'days') === 6) return 'week';

  if (after.date() === 1 && after.isSame(before, 'month') && before.date() === before.daysInMonth()) return 'month';

  return 'custom';
};

/** Snaps to the standard period containing the reference date. */
export const snapToPeriod = (ref: moment.Moment, period: 'day' | 'week' | 'month'): Timeframe => {
  switch (period) {
    case 'day':
      return { after: ref.clone().startOf('day'), before: ref.clone().endOf('day') };
    case 'week':
      return { after: ref.clone().startOf('isoWeek'), before: ref.clone().endOf('isoWeek') };
    case 'month':
      return { after: ref.clone().startOf('month'), before: ref.clone().endOf('month') };
  }
};

/**
 * Navigate to the next or previous period.
 * Standard periods (day/week/month) snap to their natural boundaries.
 * Custom ranges shift by their exact duration in days.
 */
const navigate = (timeframe: Timeframe, direction: 'next' | 'previous'): Timeframe => {
  const sign = direction === 'next' ? 1 : -1;
  const { after, before } = timeframe;

  switch (detectPeriod(timeframe)) {
    case 'day': {
      const base = after.clone().add(sign, 'day');
      return { after: base.clone().startOf('day'), before: base.clone().endOf('day') };
    }
    case 'week': {
      const base = after.clone().add(sign * 7, 'days');
      return { after: base.clone().startOf('isoWeek'), before: base.clone().endOf('isoWeek') };
    }
    case 'month': {
      const base = after.clone().add(sign, 'month');
      return { after: base.clone().startOf('month'), before: base.clone().endOf('month') };
    }
    case 'custom': {
      const days = before.diff(after, 'days') + 1;
      return {
        after: after.clone().add(sign * days, 'days'),
        before: before.clone().add(sign * days, 'days'),
      };
    }
  }
};

interface UseTimeframeProps {
  initialTimeframe?: Timeframe;
}

export const useTimeframe = ({ initialTimeframe }: UseTimeframeProps = {}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe ?? getInitialTimeframe());

  const goToPeriod = useCallback((direction: 'next' | 'previous') => {
    setTimeframe((current) => navigate(current, direction));
  }, []);

  const goToNextPeriod = useCallback(() => goToPeriod('next'), [goToPeriod]);
  const goToPreviousPeriod = useCallback(() => goToPeriod('previous'), [goToPeriod]);

  const reset = useCallback(() => setTimeframe(getInitialTimeframe()), []);

  return {
    timeframe,
    setTimeframe,
    goToNextPeriod,
    goToPreviousPeriod,
    reset,
  };
};
