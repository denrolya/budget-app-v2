import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys as accountKeys } from '@/features/accounts/api/keys';

import type { BankIntegrationRaw, CreateBankIntegrationDTO, UpdateBankIntegrationDTO } from '../types';

import { queryKeys } from './keys';
import { bankIntegrationService } from './service';

export const useCreateBankIntegration = () => {
  const qc = useQueryClient();

  return useMutation<BankIntegrationRaw, Error, CreateBankIntegrationDTO>({
    mutationFn: (payload) => bankIntegrationService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.list() });
    },
    onError: () => {
      toast.error('Failed to create bank integration');
    },
  });
};

export const useUpdateBankIntegration = (id: number) => {
  const qc = useQueryClient();

  return useMutation<BankIntegrationRaw, Error, UpdateBankIntegrationDTO>({
    mutationFn: (payload) => bankIntegrationService.update(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData<BankIntegrationRaw>(queryKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.list() });
    },
    onError: () => {
      toast.error('Failed to update bank integration');
    },
  });
};

export const useDeleteBankIntegration = () => {
  const qc = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => bankIntegrationService.remove(id),
    onSuccess: (_, id) => {
      qc.setQueryData<BankIntegrationRaw[]>(queryKeys.list(), (old) => old?.filter((i) => i.id !== id));
      qc.invalidateQueries({ queryKey: accountKeys.list() });
    },
    onError: () => {
      toast.error('Failed to delete bank integration');
    },
  });
};

export const useSyncBankIntegration = (id: number) => {
  const qc = useQueryClient();

  return useMutation<{ created: number }, Error, { from?: string; to?: string } | void>({
    mutationFn: (params) => bankIntegrationService.sync(id, params?.from, params?.to),
    onSuccess: ({ created }) => {
      if (created === 0) {
        toast.success('Sync complete — no new transactions found');
      } else {
        toast.success(`Sync complete — ${created} new transaction${created !== 1 ? 's' : ''} imported`);
      }
      qc.invalidateQueries({ queryKey: accountKeys.list() });
    },
    onError: () => {
      toast.error('Bank sync failed');
    },
  });
};

export const useRegisterWebhook = (id: number) =>
  useMutation<{ webhookUrl: string }, Error, void>({
    mutationFn: () => bankIntegrationService.registerWebhook(id),
    onSuccess: ({ webhookUrl }) => {
      toast.success(`Webhook registered: ${webhookUrl}`);
    },
    onError: () => {
      toast.error('Failed to register webhook');
    },
  });
