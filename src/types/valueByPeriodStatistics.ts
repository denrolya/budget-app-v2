import { Moment } from 'moment';

import { StatisticsConfig } from '@/types/statistics';
import { Type as TransactionType } from '@/types/transaction';

export interface ValueByPeriodDataDTO {
  expense: number;
  income: number;
  after: number;
  before: number;
}

export interface ValueByPeriodData {
  expense: number;
  income: number;
  after: Moment;
  before: Moment;
}

export interface UseStatisticsParams {
  after?: Moment;
  before?: Moment;
  period?: string;
  type?: TransactionType | null;
  accounts?: (number| string)[];
  categories?: (number | string)[];
  queryKey?: string;
}

export interface UseStatisticsReturn {
  data: ValueByPeriodData[]; // Define the expected response type here
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface ValueByPeriodParams {
  config: StatisticsConfig;
  after?: Moment;
  before?: Moment;
}

export interface MinMaxStatistics {
  min: number;
  max: number;
  minDate?: Moment;
  maxDate?: Moment;
}

export type StatisticsData = number | MinMaxStatistics;
export type PercentageChange = number | { min: number; max: number };
export type IsIncrease = boolean | { min: boolean; max: boolean };
