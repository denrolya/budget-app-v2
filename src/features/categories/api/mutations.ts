import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { UpdateCategoryDTO } from '../types';

import { categoriesService } from './service';
import { queryKeys } from './keys';


export const useMutations = (opts?: { queryKey?: readonly unknown[] }) => {
  const qc = useQueryClient();

  const invalidate = async () => {
    if (opts?.queryKey) {
      await qc.invalidateQueries({ queryKey: opts.queryKey });
    } else {
      await qc.invalidateQueries({ queryKey: queryKeys.all });
    }
  };

  const createMutation = useMutation({
    mutationFn: categoriesService.create,
    onSuccess: async () => {
      await invalidate();
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create category', { description: error.message || 'Unexpected error.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: number; payload: UpdateCategoryDTO }) =>
      categoriesService.update(args.id, args.payload),
    onSuccess: async () => {
      await invalidate();
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update category', { description: error.message || 'Unexpected error.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesService.delete,
    onSuccess: async () => {
      await invalidate();
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete category', { description: error.message || 'Unexpected error.' });
    },
  });

  const move = async (args: { id: number; type: UpdateCategoryDTO['type']; newParentId: number | null }) =>
    updateMutation.mutateAsync({
      id: args.id,
      payload: { type: args.type, parentId: args.newParentId },
    });

  const moveWithBreadcrumb = async (
    args: { id: number; type: UpdateCategoryDTO['type']; newParentId: number | null },
    breadcrumbPath?: string[],
  ) => {
    const result = await move(args);

    const locationText =
      breadcrumbPath && breadcrumbPath.length > 0 ? breadcrumbPath.join(' / ') : 'Root level';

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
