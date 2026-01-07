import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/features/accounts/api/keys';
import { accountService } from '@/features/accounts/api/service';
import Account from '@/features/accounts/models/Account';

// assuming you have these query keys already:
const exchangeRatesKey = ['exchangeRates'] as const;

type ExchangeRatesData = {
  fixer: Record<string, number>;
  mono: Record<string, number>;
  wise: Record<string, number>;
};

export const useMutations = () => {
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (args: { account: Account; diff: Partial<Account> }) => {
      const raw = await accountService.update(args.account.id, args.diff);

      // rebuild model w/ converted values if we can
      const rates = qc.getQueryData<ExchangeRatesData>(exchangeRatesKey)?.fixer;

      const next =
        rates ? accountService.withConvertedValues(raw as any, rates) : new Account(raw as any);

      return next;
    },

    onSuccess: (next) => {
      qc.setQueryData<Account[]>(queryKeys.all, (old) => {
        if (!old) return old;
        return old.map((a) => (a.id === next.id ? next : a));
      });

      toast.success('Account updated');
    },

    onError: (error: Error) => {
      toast.error('Failed to update account', {
        description: error.message || 'Unexpected error.',
      });
    },
  });

  return {
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
