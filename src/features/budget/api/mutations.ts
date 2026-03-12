import { useMutation, useQueryClient } from '@tanstack/react-query';

import { budgetService } from './service';
import { queryKeys } from './keys';
import type { BudgetDTO, CreateBudgetDTO, UpsertBudgetLineDTO } from './types';

export const useCreateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBudgetDTO) => budgetService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.all() }),
  });
};

export const useDeleteBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetService.remove(id),
    onSuccess: (_, id) => {
      // Immediately remove from list cache so BudgetIndex doesn't redirect to the deleted budget
      qc.setQueryData<{ data: BudgetDTO[] }>(queryKeys.all(), (old) =>
        old ? { ...old, data: old.data.filter((b) => b.id !== id) } : old,
      );
      qc.invalidateQueries({ queryKey: queryKeys.all() });
    },
  });
};

export const useUpsertBudgetLine = (budgetId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, payload }: { lineId: number | null; payload: UpsertBudgetLineDTO }) =>
      lineId ? budgetService.updateLine(budgetId, lineId, payload) : budgetService.createLine(budgetId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.detail(budgetId) }),
  });
};

// Batch-create multiple lines with a single cache invalidation (avoids N×2 requests)
export const useBatchCreateBudgetLines = (budgetId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lines: UpsertBudgetLineDTO[]) =>
      Promise.all(lines.map((payload) => budgetService.createLine(budgetId, payload))),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.detail(budgetId) }),
  });
};

export const useUpdateBudgetLineNote = (budgetId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, note }: { lineId: number; note: string | null }) =>
      budgetService.updateLine(budgetId, lineId, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.detail(budgetId) }),
  });
};
