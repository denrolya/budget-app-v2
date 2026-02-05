import type { AxiosError } from 'axios';

import { api, axiosFetcher } from '@/services/api';

import type { CategoryApiResponseDTO, CreateCategoryDTO, UpdateCategoryDTO } from '../types';

const API_BASE = '/api/categories';
const ENDPOINT = '/api/v2/category';

export type RawCategoriesResponse = unknown;

type ApiErrorPayload = {
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<ApiErrorPayload> | undefined;
  const messageFromApi = axiosError?.response?.data?.message;
  const messageFromError = axiosError?.message;

  return messageFromApi || messageFromError || fallback;
};

export const categoriesService = {
  fetchList: async (): Promise<RawCategoriesResponse> => axiosFetcher(ENDPOINT),

  create: async (payload: CreateCategoryDTO): Promise<CategoryApiResponseDTO> => {
    try {
      const { data } = await api.post<CategoryApiResponseDTO>(`${API_BASE}/${payload.type}`, {
        name: payload.name,
        type: payload.type,
        parent: payload.parentId ?? null,
        isAffectingProfit: payload.isAffectingProfit ?? true,
        isTechnical: payload.isTechnical ?? false,
        isFixed: payload.isFixed ?? false,
        icon: '',
        color: null,
        tags: [],
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
        parent: payload.parentId,
        isAffectingProfit: payload.isAffectingProfit,
        isTechnical: payload.isTechnical,
        isFixed: payload.isFixed,
        icon: '',
        tags: [],
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
