import { useQuery } from '@tanstack/react-query';

import { useList as useAccountsQuery } from '@/features/accounts';
import { useList as useCategoriesQuery } from '@/features/categories';

import type Debt from '..//models/Debt';
import { mapDebtDTOToModel } from '../lib/mapDebtDTOToModel';

import { queryKeys } from './keys';
import { debtService } from './service';

export const useList = () => {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();

  return useQuery<Debt[], Error>({
    queryKey: queryKeys.list(),
    enabled: !!accounts.data && !!categories.data,
    queryFn: async () => {
      const dtos = await debtService.fetchList();
      const deps = { accounts: accounts.data!, categories: categories.data!.list };
      return dtos.map((dto) => mapDebtDTOToModel(dto, deps));
    },
    staleTime: 1000 * 60 * 5,
    retry: 3,
  });
};
