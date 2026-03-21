import { useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { toast } from 'sonner';

import { api } from '@/services/api';
import { queryKeys as accountQueryKeys } from '@/features/accounts';

import type { CreateTransferInput, UpdateTransferInput } from '../types';

import { queryKeys } from './keys';

const buildPayload = (input: CreateTransferInput) => ({
  from: input.from,
  to: input.to,
  amount: input.amount,
  rate: input.rate,
  fees: input.fees,
  executedAt: moment(input.executedAt).toISOString(),
  note: input.note ?? '',
});

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
    mutationFn: async (input: CreateTransferInput) =>
      api.post('/api/transfers', buildPayload(input)).then((r) => r.data),
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
    mutationFn: async ({ id, ...input }: UpdateTransferInput) =>
      api.put(`/api/transfers/${id}`, buildPayload(input)).then((r) => r.data),
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
