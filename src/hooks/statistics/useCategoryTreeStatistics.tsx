import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Moment } from 'moment';
import { DependencyList, useEffect } from 'react';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useCategories } from '@/contexts/FinanceData';
import Category from '@/models/Category';
import { axiosFetcher } from '@/services/api';
import { Type as TransactionType } from '@/types/transaction';
import { generateQueryParamsString } from '@/lib/url/generateQueryParamsString';

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
  data: Category[] | undefined;
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
  const categories = useCategories();

  const transformCategoryNode = (node: CategoryNode): Category => {
    const category = categories[type]?.find((c: Category) => c.id === node.id) || new Category(node);
    return {
      ...category,
      total: node.total,
      value: node.value,
      children: node.children.map(transformCategoryNode),
    };
  };

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<CategoryNode[], Error, Category[]>({
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
    select: (data) => data.map(transformCategoryNode),
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

