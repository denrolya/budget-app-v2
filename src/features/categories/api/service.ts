import { axiosFetcher } from '@/services/api';

const ENDPOINT = '/api/v2/category';

export type RawCategoriesResponse = unknown;

export const categoriesService = {
  fetchList: async (): Promise<RawCategoriesResponse> => axiosFetcher(ENDPOINT),
};
