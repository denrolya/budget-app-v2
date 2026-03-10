import { useQuery } from '@tanstack/react-query';

import type { BankAccountData, BankIntegrationRaw } from '../types';

import { queryKeys } from './keys';
import { bankIntegrationService } from './service';

export const useBankIntegrationList = () =>
  useQuery<BankIntegrationRaw[], Error>({
    queryKey: queryKeys.list(),
    queryFn: () => bankIntegrationService.fetchList(),
    staleTime: 1000 * 60 * 5,
  });

export const useBankIntegration = (id: number) =>
  useQuery<BankIntegrationRaw, Error>({
    queryKey: queryKeys.detail(id),
    queryFn: () => bankIntegrationService.fetchOne(id),
    staleTime: 1000 * 60 * 5,
  });

export const useBankAccounts = (id: number, enabled = true) =>
  useQuery<BankAccountData[], Error>({
    queryKey: queryKeys.accounts(id),
    queryFn: () => bankIntegrationService.fetchBankAccounts(id),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
