import { type Moment } from 'moment';
import type moment from 'moment';

import { type COMMON_TIMEFRAMES } from '@/constants/datetime';
import { type DebugLogger } from '@/services/DebugLogger';

declare global {
  let logger:
    | DebugLogger
    | {
        info: (message: any, component?: string) => void;
        warn: (message: any, component?: string) => void;
        error: (message: any, component?: string) => void;
      };
}

export interface Timeframe {
  after: Moment;
  before: Moment;
}

export interface TimeframeStep {
  unit: moment.unitOfTime.DurationConstructor;
  amount: number;
}

export interface TimeframeOption {
  label: string;
  value: TimeframeValue;
  range: Timeframe;
}

export type TimeframeValue = (typeof COMMON_TIMEFRAMES)[number] | (typeof TIMEFRAME_VALUES)[number];

export type ISO8601Period =
  | `P${number}Y`
  | `P${number}W`
  | `P${number}D`
  | `P${number}H`
  | `P${number}M`
  | `P${number}S`;

export interface PeriodOption {
  label: string;
  value: ISO8601Period;
}

export type PeriodValue = '1 day' | '1 week' | '1 month';
