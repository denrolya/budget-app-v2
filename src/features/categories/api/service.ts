import type { AxiosError } from 'axios';

import { fetchCollection } from '@/lib/api';
import { api } from '@/services/api';

import type { CategoryApiResponseDTO, CreateCategoryDTO, UpdateCategoryDTO } from '../types';

const API_BASE = '/api/categories';

type ApiErrorPayload = {
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<ApiErrorPayload> | undefined;
  return axiosError?.response?.data?.message || axiosError?.message || fallback;
};

export const categoriesService = {
  fetchList: async (): Promise<CategoryApiResponseDTO[]> => fetchCollection<CategoryApiResponseDTO>(API_BASE),

  create: async (payload: CreateCategoryDTO): Promise<CategoryApiResponseDTO> => {
    try {
      const { data } = await api.post<CategoryApiResponseDTO>(`${API_BASE}/${payload.type}`, {
        name: payload.name,
        parent: payload.parent ?? null,
        isAffectingProfit: payload.isAffectingProfit ?? true,
      });

      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create category'));
    }
  },

  update: async (id: number, payload: UpdateCategoryDTO): Promise<CategoryApiResponseDTO> => {
    try {
      const { data } = await api.put<CategoryApiResponseDTO>(`${API_BASE}/${id}`, {
        id,
        type: payload.type,
        name: payload.name,
        parent: payload.parent ?? null,
        isAffectingProfit: payload.isAffectingProfit,
      });

      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update category'));
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`${API_BASE}/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete category'));
    }
  },
};
