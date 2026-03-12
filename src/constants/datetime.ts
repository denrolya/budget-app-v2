import moment from 'moment';

import { type PeriodOption, type Timeframe, type TimeframeOption } from '@/types/global';

export const BACKEND_DATE_FORMAT = 'YYYY-MM-DD';
export const MOMENT_DATE_GENERIC_FORMAT = 'DD-MM-YYYY';
export const MOMENT_TIME_VIEW_FORMAT = 'HH:mm';
export const MOMENT_DATE_VIEW_FORMAT = 'MMM Do, YYYY';
export const MOMENT_DATE_VIEW_FORMAT_2 = 'MMM D, YYYY';
export const MOMENT_DATETIME_VIEW_FORMAT = `${MOMENT_DATE_VIEW_FORMAT} ${MOMENT_TIME_VIEW_FORMAT}`;

export const MOMENT_DATETIME_FORM_FORMAT = 'YYYY-MM-DDTHH:mm';

export const MOMENT_DATEPICKER_FORMAT = 'MMM D, YYYY';

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  {
    label: '1D',
    value: '1D',
    range: {
      after: moment().subtract(1, 'day').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: 'WTD',
    value: 'WTD',
    range: {
      after: moment().startOf('isoWeek').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: 'MTD',
    value: 'MTD',
    range: {
      after: moment().startOf('month').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: '1M',
    value: '1M',
    range: {
      after: moment().subtract(1, 'month').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: '3M',
    value: '3M',
    range: {
      after: moment().subtract(3, 'months').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: '6M',
    value: '6M',
    range: {
      after: moment().subtract(6, 'months').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: 'YTD',
    value: 'YTD',
    range: {
      after: moment().startOf('year').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: '1Y',
    value: '1Y',
    range: {
      after: moment().subtract(1, 'year').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: '3Y',
    value: '3Y',
    range: {
      after: moment().subtract(3, 'years').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: '5Y',
    value: '5Y',
    range: {
      after: moment().subtract(5, 'years').startOf('day'),
      before: moment().endOf('day'),
    },
  },
] as const;

export const DASHBOARD_TIMEFRAME_OPTIONS: Array<{ label: string; value?: string; range: Timeframe }> = [
  {
    label: 'Summer',
    range: { after: moment().month(5).startOf('month'), before: moment().month(8).endOf('month') },
  },
  {
    label: 'Winter',
    range: { after: moment().month(11).startOf('month'), before: moment().month(1).endOf('month') },
  },
  {
    label: 'Spring',
    range: { after: moment().month(2).startOf('month'), before: moment().month(5).endOf('month') },
  },
  {
    label: 'Autumn',
    range: { after: moment().month(8).startOf('month'), before: moment().month(11).endOf('month') },
  },
  {
    label: 'MTD',
    value: 'MTD',
    range: {
      after: moment().startOf('month').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  {
    label: 'Prev Month',
    range: {
      after: moment().subtract(1, 'month').startOf('month'),
      before: moment().subtract(1, 'month').endOf('month'),
    },
  },
  { label: 'This Month', range: { after: moment().startOf('month'), before: moment().endOf('month') } },
  {
    label: 'YTD',
    value: 'YTD',
    range: {
      after: moment().startOf('year').startOf('day'),
      before: moment().endOf('day'),
    },
  },
  { label: 'This Year', range: { after: moment().startOf('year'), before: moment().endOf('year') } },
  {
    label: 'Last Year',
    range: { after: moment().subtract(1, 'year').startOf('year'), before: moment().subtract(1, 'year').endOf('year') },
  },
  {
    label: 'Last 2 Years',
    range: { after: moment().subtract(2, 'year').startOf('year'), before: moment() },
  },
  {
    label: 'Last 3 Years',
    range: { after: moment().subtract(3, 'year').startOf('year'), before: moment() },
  },
  {
    label: 'Last 5 Years',
    range: { after: moment().subtract(5, 'year').startOf('year'), before: moment() },
  },
  {
    label: 'Last 10 Years',
    range: { after: moment().subtract(10, 'year').startOf('year'), before: moment() },
  },
];
export const COMMON_TIMEFRAMES = ['WTD', 'MTD', '3M', 'YTD'] as const;

export const PERIOD_OPTIONS: PeriodOption[] = [
  { label: '1 Day', value: 'P1D' },
  { label: '1 Week', value: 'P1W' },
  { label: '1 Month', value: 'P1M' },
  { label: '3 Months', value: 'P3M' },
  { label: '6 Months', value: 'P6M' },
  { label: '1 Year', value: 'P1Y' },
];

export const FILTER_PRESETS = [
  {
    label: 'Prev Month',
    range: {
      after: moment().subtract(1, 'month').startOf('month'),
      before: moment().subtract(1, 'month').endOf('month'),
    },
  },
  { label: 'This Month', range: { after: moment().startOf('month'), before: moment().endOf('month') } },
  { label: 'Last 30 Days', range: { after: moment().subtract(30, 'days'), before: moment() } },
  { label: 'This Year', range: { after: moment().startOf('year'), before: moment().endOf('year') } },
  {
    label: 'Last Year',
    range: { after: moment().subtract(1, 'year').startOf('year'), before: moment().subtract(1, 'year').endOf('year') },
  },
];
