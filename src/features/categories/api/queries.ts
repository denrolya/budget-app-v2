import { useQuery } from '@tanstack/react-query';

import { axiosFetcher } from '@/services/api';

import { buildCategoriesData } from '../lib/buildTree';
import type { CategoryDTO } from '../types';

import { queryKeys } from './keys';

const ENDPOINT = '/api/v2/category';

export const useList = () =>
  useQuery({
    queryKey: queryKeys.all,
    queryFn: async () => {
      const raw = await axiosFetcher(ENDPOINT);
      return buildCategoriesData(raw as CategoryDTO[]);
    },
    staleTime: 1000 * 60 * 30,
    retry: 3,
  });
