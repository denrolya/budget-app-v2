import { useQuery } from '@tanstack/react-query';
import moment, { Moment } from 'moment';
import qs from 'qs';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { api } from '@/services/api';

interface RawStatisticData {
  expense: number;
  income: number;
  after: number;
  before: number;
}

export interface StatisticData {
  expense: Moment;
  income: Moment;
  after: number;
  before: number;
}

interface UseStatisticsProps {
  after?: Moment;
  before?: Moment;
  interval?: string;
  type?: 'expense' | 'income' | null;
  accounts: number[];
  categories: number[];
  queryKey?: string;
}

interface UseStatisticsReturn {
  data: StatisticData[]; // Define the expected response type here
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useStatistics = ({
                                after,
                                before,
                                interval,
                                type,
                                accounts,
                                categories,
                                queryKey = 'value-by-period',
                              }: UseStatisticsProps): UseStatisticsReturn => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<StatisticData[]>({
    queryKey: [queryKey,
      after?.format(BACKEND_DATE_FORMAT),
      before?.format(BACKEND_DATE_FORMAT),
      interval,
      type,
      accounts,
      categories,
    ],
    queryFn: async () => {
      const createQueryParams = (start: Moment, end: Moment): string => qs.stringify(
        {
          after: start.format(BACKEND_DATE_FORMAT),
          before: end.format(BACKEND_DATE_FORMAT),
          interval,
          type,
          categories,
        },
        { arrayFormat: 'brackets' },
      );

      const response = await api.get(`/api/v2/statistics/value-by-period?${createQueryParams(after, before)}`);
      return response.data;
    },
    select: (data: RawStatisticData[]): StatisticData[] => data.map((item: RawStatisticData) => ({
      after: moment(item.after),
      before: moment.unix(item.before),
      expense: item.expense,
      income: item.income,
    })),
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1h
  });

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
  };
};
