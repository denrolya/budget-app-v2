import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { CreateCategoryDTO, UpdateCategoryDTO } from '../types';

import { queryKeys } from './keys';
import { categoriesService } from './service';

type MutationOpts = { queryKey?: readonly unknown[] };

export const useMutations = (opts?: MutationOpts) => {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: opts?.queryKey ?? queryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateCategoryDTO) => categoriesService.create(payload),
    onSuccess: async () => {
      await invalidate();
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create category', { description: error.message || 'Unexpected error.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: number; payload: UpdateCategoryDTO }) => categoriesService.update(args.id, args.payload),
    onSuccess: async () => {
      await invalidate();
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update category', { description: error.message || 'Unexpected error.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesService.delete(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete category', { description: error.message || 'Unexpected error.' });
    },
  });

  const move = async (args: { id: number; type: UpdateCategoryDTO['type']; newParent: number | null }) =>
    updateMutation.mutateAsync({
      id: args.id,
      payload: { type: args.type, parent: args.newParent },
    });

  const moveWithBreadcrumb = async (
    args: { id: number; type: UpdateCategoryDTO['type']; newParent: number | null },
    breadcrumbPath?: string[],
  ) => {
    const result = await move(args);

    const locationText = breadcrumbPath?.length ? breadcrumbPath.join(' / ') : 'Root level';
    toast.success('Category moved', { description: `Now at: ${locationText}` });

    return result;
  };

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    move,
    moveWithBreadcrumb,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMoving: updateMutation.isPending,
  };
};
