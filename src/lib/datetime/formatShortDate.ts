import moment, { Moment } from 'moment';

import { Timeframe } from '@/types/global';

export const formatShortDate = (date: Moment): string => {
  const today = moment();

  if (date.isSame(today, 'day')) {
    return 'Today';
  }

  return date.format(date.isSame(today, 'year') ? 'MMM D' : 'MMM D, YYYY');
};

export const formatRange = (timeframe: Timeframe): string => {
  const { after, before } = timeframe;

  if (after.isSame(before, 'day')) {
    return formatShortDate(after);
  }

  const sameMonth = after.isSame(before, 'month') && after.isSame(before, 'year');

  if (sameMonth) {
    return `${formatShortDate(after)}–${before.format('D')}`;
  }

  return `${formatShortDate(after)}–${formatShortDate(before)}`;
};
