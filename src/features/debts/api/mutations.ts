import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { type DebtWriteDTO } from '../types';

import { queryKeys } from './keys';
import { debtService } from './service';

export const useMutations = () => {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.list() });

  const create = useMutation({
    mutationFn: (payload: DebtWriteDTO) => debtService.create(payload),
    onSuccess: async () => {
      await invalidate();
      toast.success('Debt created');
    },
    onError: (e) => {
      console.error('Debt create failed:', e);
      toast.error('Failed to create debt. Issue requires investigation.');
    },
    retry: 2,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<DebtWriteDTO> }) => debtService.update(id, payload),
    onSuccess: async () => {
      toast.success('Debt updated successfully');
      await invalidate();
    },
    onError: (e) => {
      console.error('Debt update failed:', e);
      toast.error('Failed to update debt. Issue requires investigation.');
    },
    retry: 2,
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: number }) => debtService.remove(id),
    onSuccess: async () => {
      toast.success('Debt removed');
      await invalidate();
    },
    onError: (e) => {
      console.error('Debt delete failed:', e);
      toast.error('Failed to delete debt. Issue requires investigation.');
    },
    retry: 1,
  });

  return {
    create: create.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,

    isCreating: create.isPending,
    isUpdating: update.isPending,
    isRemoving: remove.isPending,
  };
};

export default useMutations;
