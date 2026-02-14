import { useQuery } from '@tanstack/react-query';

import { useList as useAccountsQuery } from '@/features/accounts';
import { useList as useCategoriesQuery } from '@/features/categories';

import type Debt from '..//models/Debt';
import { mapDebtDTOToModel } from '../lib/mapDebtDTOToModel';

import { queryKeys } from './keys';
import { debtService } from './service';

export const useList = (opts?: { withClosed?: boolean }) => {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();

  const withClosed = opts?.withClosed ?? false;

  return useQuery<Debt[], Error>({
    queryKey: queryKeys.list({ withClosed }),
    enabled: Boolean(accounts.data && categories.data),
    queryFn: async () => {
      if (!accounts.data || !categories.data) return [];

      const dtos = await debtService.fetchList({ withClosed });
      const deps = { accounts: accounts.data, categories: categories.data.list };

      return dtos.map((dto) => mapDebtDTOToModel(dto, deps));
    },
    staleTime: 1000 * 60 * 5,
    retry: 3,
  });
};
