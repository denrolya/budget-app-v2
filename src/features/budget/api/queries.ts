import { useQuery } from '@tanstack/react-query';

import { budgetService } from './service';
import { queryKeys } from './keys';
import type {
  BudgetAnalyticsResponse,
  BudgetDTO,
  BudgetHistoryAveragesResponse,
  CategoryDailyStatsResponse,
} from './types';

export const useListBudgets = () =>
  useQuery({
    queryKey: queryKeys.all(),
    queryFn: () => budgetService.list(),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 5,
  });

export const useBudget = (id: number | null) =>
  useQuery<BudgetDTO>({
    queryKey: queryKeys.detail(id!),
    queryFn: () => budgetService.get(id!),
    enabled: id !== null,
    staleTime: 1000 * 60 * 5,
  });

export const useBudgetAnalytics = (id: number | null) =>
  useQuery<BudgetAnalyticsResponse>({
    queryKey: queryKeys.analytics(id!),
    queryFn: () => budgetService.analytics(id!),
    enabled: id !== null,
    staleTime: 1000 * 60 * 2,
  });

export const useCategoryDailyStats = (id: number | null) =>
  useQuery<CategoryDailyStatsResponse>({
    queryKey: queryKeys.analyticsDaily(id!),
    queryFn: () => budgetService.analyticsDailyStats(id!),
    enabled: id !== null,
    staleTime: 1000 * 60 * 5,
  });

export const useHistoryAverages = (id: number | null, months = 6) =>
  useQuery<BudgetHistoryAveragesResponse>({
    queryKey: queryKeys.historyAverages(id!),
    queryFn: () => budgetService.historyAverages(id!, months),
    enabled: id !== null,
    staleTime: 1000 * 60 * 10,
  });
