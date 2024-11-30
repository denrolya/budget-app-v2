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

export type ISO8601Period = `P${number}Y` | `P${number}W` | `P${number}D` | `P${number}H` | `P${number}M` | `P${number}S`;

export interface PeriodOption {
  label: string;
  value: ISO8601Period;
}

export type PeriodValue = '1 day' | '1 week' | '1 month';
