import { fetchCollection } from '@/lib/api';
import { api } from '@/services/api';

import type {
  BudgetAnalyticsResponse,
  BudgetDTO,
  BudgetHistoryAveragesResponse,
  BudgetInsightsResponse,
  BudgetLineDTO,
  BudgetSummariesResponse,
  CategoryDailyStatsResponse,
  CreateBudgetDTO,
  UpdateBudgetDTO,
  UpsertBudgetLineDTO,
} from './types';

const BUDGET_API = '/api/budgets'; // API Platform — CRUD
const BUDGET_V2 = '/api/v2/budgets'; // Legacy controller — analytics only

export const budgetService = {
  async list(): Promise<BudgetDTO[]> {
    return fetchCollection<BudgetDTO>(BUDGET_API);
  },

  async get(id: number): Promise<BudgetDTO> {
    const { data } = await api.get<BudgetDTO>(`${BUDGET_API}/${id}`);
    return data;
  },

  async create(payload: CreateBudgetDTO): Promise<BudgetDTO> {
    const { data } = await api.post<BudgetDTO>(BUDGET_API, payload);
    return data;
  },

  async update(id: number, payload: UpdateBudgetDTO): Promise<BudgetDTO> {
    const { data } = await api.put<BudgetDTO>(`${BUDGET_API}/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`${BUDGET_API}/${id}`);
  },

  async createLine(budgetId: number, payload: UpsertBudgetLineDTO): Promise<BudgetLineDTO> {
    const { data } = await api.post<BudgetLineDTO>(`${BUDGET_API}/${budgetId}/lines`, payload);
    return data;
  },

  async updateLine(budgetId: number, lineId: number, payload: Partial<UpsertBudgetLineDTO>): Promise<BudgetLineDTO> {
    const { data } = await api.put<BudgetLineDTO>(`${BUDGET_API}/${budgetId}/lines/${lineId}`, payload);
    return data;
  },

  async deleteLine(budgetId: number, lineId: number): Promise<void> {
    await api.delete(`${BUDGET_API}/${budgetId}/lines/${lineId}`);
  },

  async analytics(budgetId: number): Promise<BudgetAnalyticsResponse> {
    const { data } = await api.get<BudgetAnalyticsResponse>(`${BUDGET_V2}/${budgetId}/analytics`);
    return data;
  },

  async analyticsDailyStats(budgetId: number): Promise<CategoryDailyStatsResponse> {
    const { data } = await api.get<CategoryDailyStatsResponse>(`${BUDGET_V2}/${budgetId}/analytics/daily`);
    return data;
  },

  async historyAverages(budgetId: number, months = 6): Promise<BudgetHistoryAveragesResponse> {
    const { data } = await api.get<BudgetHistoryAveragesResponse>(`${BUDGET_V2}/${budgetId}/history-averages`, {
      params: { months },
    });
    return data;
  },

  async insights(budgetId: number, currency: string): Promise<BudgetInsightsResponse> {
    const { data } = await api.get<BudgetInsightsResponse>(`${BUDGET_V2}/${budgetId}/insights`, {
      params: { currency },
    });
    return data;
  },

  async summaries(): Promise<BudgetSummariesResponse> {
    const { data } = await api.get<BudgetSummariesResponse>(`${BUDGET_V2}/summaries`);
    return data;
  },
};
