import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import storage from '@/services/storage';
import { requestProgress } from '@/services/requestProgress';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    requestProgress.increment();
    return config;
  },
  (error) => {
    requestProgress.decrement();
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    requestProgress.decrement();
    return response;
  },
  (error) => {
    requestProgress.decrement();
    const profilerLink = error.response?.headers?.['x-debug-token-link'];
    if (profilerLink) {
      const status = error.response?.status ?? '?';
      const url = error.config?.url ?? '';
      // eslint-disable-next-line no-console
      console.error(`[API ${status}] ${url}\n  Symfony profiler: ${profilerLink}`);
    }
    return Promise.reject(error);
  },
);

const axiosFetcher = (url: string) => api.get(url).then((res) => res.data);

export { api, axiosFetcher };
