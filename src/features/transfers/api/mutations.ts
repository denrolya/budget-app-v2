import { useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { toast } from 'sonner';

import { api } from '@/services/api';
import { queryKeys as accountQueryKeys } from '@/features/accounts';

import type { CreateTransferInput, UpdateTransferInput } from '../types';

import { queryKeys } from './keys';

export const useMutations = (opts?: { invalidateKey?: readonly unknown[] }) => {
  const qc = useQueryClient();
  const invalidateKey = opts?.invalidateKey ?? queryKeys.all;

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: invalidateKey }),
      qc.invalidateQueries({ queryKey: accountQueryKeys.all }),
      qc.invalidateQueries({ queryKey: ['ledger'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const payload = {
        from: input.from,
        to: input.to,
        amount: String(input.amount),
        rate: String(input.rate),
        fee: input.fee != null ? String(input.fee) : undefined,
        feeAccount: input.feeAccount,
        executedAt: moment(input.executedAt).toISOString(),
        note: input.note ?? '',
      };

      return api.post('/api/transfers', payload).then((r) => r.data);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Transfer created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create transfer', {
        description: error?.message || 'Unexpected error.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => api.delete(`/api/transfers/${id}`).then((r) => r.data),
    onSuccess: async () => {
      await invalidate();
      toast.success('Transfer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete transfer', {
        description: error?.message || 'Unexpected error.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateTransferInput) => {
      const payload = {
        from: input.from,
        to: input.to,
        amount: String(input.amount),
        rate: String(input.rate),
        fee: input.fee != null ? String(input.fee) : undefined,
        feeAccount: input.feeAccount,
        executedAt: moment(input.executedAt).toISOString(),
        note: input.note ?? '',
      };
      return api.put(`/api/transfers/${id}`, payload).then((r) => r.data);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Transfer updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update transfer', {
        description: error?.message || 'Unexpected error.',
      });
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
