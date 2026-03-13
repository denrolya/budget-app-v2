import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Moment } from 'moment';
import { type DependencyList, useEffect } from 'react';

import { useBaseCurrency } from '@/features/auth';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useCategories } from '@/hooks/financeData';
import { Category } from '@/features/categories';
import type { CategoryDTO } from '@/features/categories/types';
import { axiosFetcher } from '@/services/api';
import { type Type as TransactionType } from '@/features/transactions';
import { generateQueryParamsString } from '@/lib/url/generateQueryParamsString';

const URL = '/api/v2/statistics/category/tree';

interface CategoryNode {
  id: number;
  createdAt: string;
  name: string;
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
  { after, before, type, queryKey = 'category-tree-statistics' }: UseCategoryTreeStatisticsParams,
  dependencies: DependencyList = [],
): UseCategoryTreeStatisticsReturn => {
  const baseCurrency = useBaseCurrency();
  const queryClient = useQueryClient();
  const categories = useCategories();

  const transformCategoryNode = (node: CategoryNode): Category => {
    const categoryList = (categories as unknown as Record<string, Category[]>)[type as string];
    const category =
      categoryList?.find((c: Category) => c.id === node.id) ||
      new Category(node as unknown as CategoryDTO);
    return {
      ...category,
      total: node.total,
      value: node.value,
      children: node.children.map(transformCategoryNode),
    } as unknown as Category;
  };

  const { data, isLoading, error, refetch } = useQuery<CategoryNode[], Error, Category[]>({
    queryKey: [
      queryKey,
      after.format(BACKEND_DATE_FORMAT),
      before.format(BACKEND_DATE_FORMAT),
      type,
      baseCurrency,
      ...dependencies,
    ],
    queryFn: async (): Promise<CategoryNode[]> =>
      (await axiosFetcher(
        `${URL}?${generateQueryParamsString({
          after,
          before,
          type,
        })}`,
      )) as CategoryNode[],
    select: (data) => data.map(transformCategoryNode),
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1h
  });

  useEffect(
    () => () => {
      queryClient.cancelQueries({ queryKey: [queryKey] });
    },
    [queryClient, queryKey],
  );

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- spread of caller-provided DependencyList is intentional
  }, [refetch, ...dependencies]);

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
  };
};
