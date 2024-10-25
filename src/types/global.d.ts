import { Moment } from 'moment';

import { DebugLogger } from '@/utils/DebugLogger';

declare global {
  let logger: DebugLogger | {
    info: (message: any, component?: string) => void;
    warn: (message: any, component?: string) => void;
    error: (message: any, component?: string) => void;
  };
}

export interface DateRange {
  after: Moment;
  before: Moment;
}

export interface TimeframeOption {
  label: string;
  value: TimeframeValue;
  getDateRange: (now: Moment) => DateRange;
}

export type TimeframeValue = typeof COMMON_TIMEFRAMES[number] | typeof TIMEFRAME_VALUES[number];

export interface PeriodOption {
  label: string;
  value: PeriodValue;
}

export type PeriodValue = '1 day' | '1 week' | '1 month';
