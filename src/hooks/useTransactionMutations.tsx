import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useFinanceData } from '@/contexts/FinanceData';
import Transaction from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import { transactionService } from '@/services/api/transaction';

export const useTransactionMutations = (queryKey: string = 'transactions') => {
  const queryClient = useQueryClient();
  const { refetchAccounts } = useFinanceData();

  const createMutation = useMutation({
    mutationFn: async (newTransaction: Partial<Transaction>) =>
      await transactionService.createTransaction(newTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      refetchAccounts();
      toast.success('Transaction created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create transaction', {
        description: error.message || 'An unexpected error occurred.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
                         id,
                         updates,
                         originalTransaction,
                       }: {
      id: string | number;
      updates: Partial<Transaction>;
      originalTransaction: Transaction;
    }) => await transactionService.updateTransaction(id, updates, originalTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      refetchAccounts();
      toast.success('Transaction updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update transaction', {
        description: error.message || 'An unexpected error occurred.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => await transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      refetchAccounts();
      toast.success('Transaction deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete transaction', {
        description: error.message || 'An unexpected error occurred.',
      });
    },
  });

  const exportCsvMutation = useMutation({
    mutationFn: async (filters?: TransactionFilters) => {
      await transactionService.exportTransactionsCsv(filters);
    },
  });

  const exportTransactionsCsv = async (filters?: TransactionFilters) => {
    const id = `tx-csv-export-${Date.now()}`;

    toast.loading('Preparing CSV export…', { id });

    try {
      await exportCsvMutation.mutateAsync(filters);
      toast.success('CSV export started', {
        id,
        description: 'Your download should begin shortly.',
      });
    } catch (e: any) {
      toast.error('CSV export failed', {
        id,
        description: e?.message || 'An unexpected error occurred.',
      });
      throw e;
    }
  };

  return {
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,

    exportTransactionsCsv,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExportingCsv: exportCsvMutation.isPending,
  };
};
