import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import Transaction from '../models/Transaction';
import { TransactionFilters } from '../models/TransactionFilters';

import { queryKeys } from './keys';
import { transactionService } from './service';

export const useMutations = (opts?: { invalidateKey?: string | readonly unknown[] }) => {
  const qc = useQueryClient();

  const invalidateKey = opts?.invalidateKey ?? queryKeys.all; // default array form

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({
        queryKey: Array.isArray(invalidateKey) ? invalidateKey : [invalidateKey],
      }),
      qc.invalidateQueries({ queryKey: queryKeys.all }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (newTx: Partial<Transaction>) => transactionService.create(newTx),
    onSuccess: async () => {
      await invalidate();
      toast.success('Transaction created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create transaction', { description: error.message || 'Unexpected error.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string | number; updates: Partial<Transaction>; originalTransaction: Transaction }) =>
      transactionService.update(args.id, args.updates, args.originalTransaction),
    onSuccess: async () => {
      await invalidate();
      toast.success('Transaction updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update transaction', { description: error.message || 'Unexpected error.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => transactionService.delete(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Transaction deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete transaction', { description: error.message || 'Unexpected error.' });
    },
  });

  const exportCsvMutation = useMutation({
    mutationFn: (filters: TransactionFilters) => transactionService.exportCsv(filters),
  });

  const exportTransactionsCsv = async (filters: TransactionFilters) => {
    const id = `tx-csv-export-${Date.now()}`;
    toast.loading('Preparing CSV export…', { id });

    try {
      await exportCsvMutation.mutateAsync(filters);
      toast.success('CSV export started', { id, description: 'Your download should begin shortly.' });
    } catch (e: any) {
      toast.error('CSV export failed', { id, description: e?.message || 'Unexpected error.' });
      throw e;
    }
  };

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    exportTransactionsCsv,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExportingCsv: exportCsvMutation.isPending,
  };
};
