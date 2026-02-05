import { useQuery } from '@tanstack/react-query';

import { buildCategoriesData } from '../lib/buildTree';
import type { CategoryDTO } from '../types';

import { queryKeys } from './keys';
import { categoriesService } from './service';

export const useList = () =>
  useQuery({
    queryKey: queryKeys.all,
    queryFn: async () => {
      const raw = await categoriesService.fetchList();
      return buildCategoriesData(raw as CategoryDTO[]);
    },
    staleTime: 1000 * 60 * 30,
    retry: 3,
  });
