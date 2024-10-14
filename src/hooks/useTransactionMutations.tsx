import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useFinanceData } from '@/contexts/FinanceData';
import Transaction from '@/models/Transaction';
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
      toast.success('Transaction created successfully', {
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create transaction', {
        description: error.message || 'An unexpected error occurred.',
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates, originalTransaction }: {
      id: string | number;
      updates: Partial<Transaction>;
      originalTransaction: Transaction
    }) => await transactionService.updateTransaction(id, updates, originalTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      refetchAccounts();
      toast.success('Transaction updated successfully', {
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update transaction', {
        description: error.message || 'An unexpected error occurred.',
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) =>
      await transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      refetchAccounts();
      toast.success('Transaction deleted successfully', {
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete transaction', {
        description: error.message || 'An unexpected error occurred.',
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
    },
  });

  return {
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
