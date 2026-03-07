import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import storage from '@/services/storage';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const axiosFetcher = (url: string) => api.get(url).then((res) => res.data);

export { api, axiosFetcher };
