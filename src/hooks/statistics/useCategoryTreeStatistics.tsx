import { useQuery, useQueryClient } from '@tanstack/react-query';
import moment, { Moment } from 'moment';
import { DependencyList, useEffect } from 'react';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { axiosFetcher } from '@/services/api';
import { Type as TransactionType } from '@/types/transaction';
import { generateQueryParamsString } from '@/utils/generateQueryParamsString';

const URL = '/api/v2/statistics/category/tree';

interface CategoryNode {
  id: number;
  createdAt: string;
  name: string;
  isTechnical: boolean;
  children: CategoryNode[];
  isAffectingProfit: boolean;
  icon: string | null;
  color: string | null;
  tags: string[];
  value: number;
  total: number;
  type: TransactionType;
}

interface UseCategoryTreeStatisticsParams {
  after: Moment;
  before: Moment;
  type: TransactionType;
  queryKey?: string;
}

interface UseCategoryTreeStatisticsReturn {
  data: CategoryNode[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useCategoryTreeStatistics = (
  {
    after,
    before,
    type,
    queryKey = 'category-tree-statistics',
  }: UseCategoryTreeStatisticsParams,
  dependencies: DependencyList = [],
): UseCategoryTreeStatisticsReturn => {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<CategoryNode[], Error>({
    queryKey: [
      queryKey,
      after.format(BACKEND_DATE_FORMAT),
      before.format(BACKEND_DATE_FORMAT),
      type,
      ...dependencies,
    ],
    queryFn: async (): Promise<CategoryNode[]> => await axiosFetcher(`${URL}?${generateQueryParamsString({
      after,
      before,
      type,
    })}`) as CategoryNode[],
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
    data: data || [],
    isLoading,
    error,
    refetch,
  };
};
