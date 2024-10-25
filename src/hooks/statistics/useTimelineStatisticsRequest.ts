import { useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { DependencyList, useEffect } from 'react';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { axiosFetcher } from '@/services/api';
import { generateQueryParamsString } from '@/utils/generateQueryParamsString';

const URL = '/api/v2/statistics/category/timeline';

interface TimelineDataPoint {
  date: number;
  value: number;
}

interface TimelineData {
  [category: string]: TimelineDataPoint[];
}

interface TimelineDataProcessed {
  [category: string]: {
    date: moment.Moment;
    value: number;
  }[];
}

interface UseTimelineStatisticsParams {
  after: moment.Moment;
  before: moment.Moment;
  period: string;
  categories: number[];
  queryKey?: string;
}

interface UseTimelineStatisticsReturn {
  data: TimelineDataProcessed | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useTimelineStatistics = (
  {
    after,
    before,
    period,
    categories,
    queryKey = 'timeline-statistics',
  }: UseTimelineStatisticsParams,
  dependencies: DependencyList = [],
): UseTimelineStatisticsReturn => {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<TimelineData, Error, TimelineDataProcessed>({
    queryKey: [
      queryKey,
      after.format(BACKEND_DATE_FORMAT),
      before.format(BACKEND_DATE_FORMAT),
      period,
      categories,
      ...dependencies,
    ],
    queryFn: async (): Promise<TimelineData> => await axiosFetcher(`${URL}?${generateQueryParamsString({
        after,
        before,
        period,
        categories,
      })}`) as TimelineData,
    select: (data: TimelineData): TimelineDataProcessed => {
      const processedData: TimelineDataProcessed = {};
      Object.entries(data).forEach(([category, timelineData]) => {
        processedData[category] = timelineData.map(item => ({
          date: moment.unix(item.date),
          value: item.value,
        }));
      });
      return processedData;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1h
  });

  useEffect(() => () => {
    queryClient.cancelQueries({ queryKey: [queryKey] });
  }, [queryClient, queryKey]);

  useEffect(() => {
    refetch();
  }, [refetch, ...dependencies]);

  return {
    data: data || {},
    isLoading,
    error,
    refetch,
  };
};
