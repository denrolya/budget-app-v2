import { useMutation, useQueryClient } from '@tanstack/react-query';

import { budgetService } from './service';
import { queryKeys } from './keys';
import type { CreateBudgetDTO, UpsertBudgetLineDTO } from './types';

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
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.all() }),
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

export const useUpdateBudgetLineNote = (budgetId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, note }: { lineId: number; note: string | null }) =>
      budgetService.updateLine(budgetId, lineId, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.detail(budgetId) }),
  });
};
