import moment, { Moment } from 'moment/moment';

export const BACKEND_DATE_FORMAT = 'YYYY-MM-DD';
export const MOMENT_TIME_VIEW_FORMAT = 'HH:mm';
export const MOMENT_DATE_VIEW_FORMAT = 'MMM Do, YYYY';
export const MOMENT_DATETIME_VIEW_FORMAT = `${MOMENT_DATE_VIEW_FORMAT} ${MOMENT_TIME_VIEW_FORMAT}`;

export const MOMENT_DATEPICKER_FORMAT = 'MMM D, YYYY';

export const PERIOD_OPTIONS = [
  {
    label: '1D',
    value: '1D',
    getDateRange: (now: Moment) => ({
      after: now.clone().subtract(1, 'day').startOf('day'),
      before: now.clone().endOf('day'),
    }),
  },
  {
    label: '1W',
    value: '1W',
    getDateRange: (now: Moment) => ({
      after: now.clone().subtract(1, 'week').startOf('day'),
      before: now.clone().endOf('day'),
    }),
  },
  {
    label: 'MTD',
    value: 'MTD',
    getDateRange: (now: Moment) => ({
      after: now.clone().startOf('month').startOf('day'),
      before: now.clone().endOf('day'),
    }),
  },
  {
    label: '1M',
    value: '1M',
    getDateRange: (now: Moment) => ({
      after: now.clone().subtract(1, 'month').startOf('day'),
      before: now.clone().endOf('day'),
    }),
  },
  {
    label: '3M',
    value: '3M',
    getDateRange: (now: Moment) => ({
      after: now.clone().subtract(3, 'months').startOf('day'),
      before: now.clone().endOf('day'),
    }),
  },
  {
    label: '6M',
    value: '6M',
    getDateRange: (now: Moment) => ({
      after: now.clone().subtract(6, 'months').startOf('day'),
      before: now.clone().endOf('day'),
    }),
  },
  {
    label: 'YTD',
    value: 'YTD',
    getDateRange: (now: Moment) => ({
      after: now.clone().startOf('year').startOf('day'),
      before: now.clone().endOf('day'),
    }),
  },
  {
    label: '1Y',
    value: '1Y',
    getDateRange: (now: Moment) => ({
      after: now.clone().subtract(1, 'year').startOf('day'),
      before: now.clone().endOf('day'),
    }),
  },
  {
    label: '5Y',
    value: '5Y',
    getDateRange: (now: Moment) => ({
      after: now.clone().subtract(5, 'years').startOf('day'),
      before: now.clone().endOf('day'),
    }),
  },
] as const;

export type PeriodOption = typeof PERIOD_OPTIONS[number]

export const INTERVAL_OPTIONS = [
  { label: '1 Day', value: '1 day' },
  { label: '1 Week', value: '1 week' },
  { label: '1 Month', value: '1 month' },
];
