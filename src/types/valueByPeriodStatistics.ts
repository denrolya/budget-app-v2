import { type Moment } from 'moment';

import { type StatisticsConfig, type StatisticsType } from '@/types/statistics';
import { type Type as TransactionType } from '@/features/transactions';

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

export interface UseStatisticsReturn {
  data: ValueByPeriodData[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseStatisticsParams {
  after?: Moment;
  before?: Moment;
  period?: string;
  type?: TransactionType | null;
  accounts?: (number | string)[];
  categories?: (number | string)[];
  queryKey?: string;
  enabled?: boolean;
}

export interface UseValueByPeriodReturn<T extends StatisticsType> {
  currentData: ValueByPeriodData[] | undefined;
  comparisonData: ValueByPeriodData[] | undefined;
  currentValue: StatisticsData<T>;
  comparisonValue: StatisticsData<T>;
  percentageChange: PercentageChange<T>;
  isIncrease: IsIncrease<T>;
  isPositive: boolean | { min: boolean; max: boolean };
  selectedTimeframe: { after: Moment; before: Moment };
  comparisonTimeframe: { after: Moment; before: Moment };
  isLoading: boolean;
  error: Error | null;
  minDate: Moment | undefined;
  maxDate: Moment | undefined;
  isCurrentPeriod: boolean;
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

export type StatisticsData<T extends StatisticsType> = T extends StatisticsType.MinMax ? MinMaxStatistics : number;
export type PercentageChange<T extends StatisticsType> = T extends StatisticsType.MinMax
  ? {
      min: number;
      max: number;
    }
  : number;
export type IsIncrease<T extends StatisticsType> = T extends StatisticsType.MinMax
  ? {
      min: boolean;
      max: boolean;
    }
  : boolean;
