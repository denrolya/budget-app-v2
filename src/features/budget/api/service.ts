import { api } from '@/services/api';

import type {
  BudgetAnalyticsResponse,
  BudgetDTO,
  CreateBudgetDTO,
  UpdateBudgetDTO,
  UpsertBudgetLineDTO,
  BudgetLineDTO,
} from './types';

const BASE = '/api/v2/budget';

export const budgetService = {
  async list(): Promise<{ data: BudgetDTO[] }> {
    const { data } = await api.get<{ data: BudgetDTO[] }>(BASE);
    return data;
  },

  async get(id: number): Promise<BudgetDTO> {
    const { data } = await api.get<BudgetDTO>(`${BASE}/${id}`);
    return data;
  },

  async create(payload: CreateBudgetDTO): Promise<BudgetDTO> {
    const { data } = await api.post<BudgetDTO>(BASE, payload);
    return data;
  },

  async update(id: number, payload: UpdateBudgetDTO): Promise<BudgetDTO> {
    const { data } = await api.put<BudgetDTO>(`${BASE}/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },

  async createLine(budgetId: number, payload: UpsertBudgetLineDTO): Promise<BudgetLineDTO> {
    const { data } = await api.post<BudgetLineDTO>(`${BASE}/${budgetId}/line`, payload);
    return data;
  },

  async updateLine(budgetId: number, lineId: number, payload: Partial<UpsertBudgetLineDTO>): Promise<BudgetLineDTO> {
    const { data } = await api.put<BudgetLineDTO>(`${BASE}/${budgetId}/line/${lineId}`, payload);
    return data;
  },

  async deleteLine(budgetId: number, lineId: number): Promise<void> {
    await api.delete(`${BASE}/${budgetId}/line/${lineId}`);
  },

  async analytics(budgetId: number): Promise<BudgetAnalyticsResponse> {
    const { data } = await api.get<BudgetAnalyticsResponse>(`${BASE}/${budgetId}/analytics`);
    return data;
  },
};
