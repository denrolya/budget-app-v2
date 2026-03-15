import type { AxiosRequestConfig } from 'axios';

import { api } from '@/services/api';
import type { HydraCollection } from '@/types/api';

export const fetchCollection = async <T>(url: string, config?: AxiosRequestConfig): Promise<T[]> => {
  const { data } = await api.get<HydraCollection<T>>(url, config);
  return data['hydra:member'];
};
