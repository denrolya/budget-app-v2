import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/features/accounts/api/keys';
import { accountService } from '@/features/accounts/api/service';
import Account from '@/features/accounts/models/Account';
import { exchangeRatesQueryKey } from '@/services/api/exchangeRates.queries';

import { type CreateAccountDTO, type UpdateAccountDTO } from '../types';

type ExchangeRatesData = {
  fixer: Record<string, number>;
  mono: Record<string, number>;
  wise: Record<string, number>;
};

const sanitize = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  if (typeof obj !== 'object' || obj === null) return {};
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    out[key as keyof T] = value as any; // keep nulls (archivedAt)
  }
  return out;
};

export const useMutations = () => {
  const qc = useQueryClient();

  const rebuildAccountModel = (raw: unknown): Account => {
    const rates = qc.getQueryData<ExchangeRatesData>(exchangeRatesQueryKey)?.fixer;
    return rates ? accountService.withConvertedValues(raw as any, rates) : new Account(raw as any);
  };

  const upsertCache = (next: Account) => {
    qc.setQueryData<Account[]>(queryKeys.list(), (old) => {
      if (!old) return [next];
      const exists = old.some((a) => a.id === next.id);
      return exists ? old.map((a) => (a.id === next.id ? next : a)) : [...old, next];
    });
  };

  const createMutation = useMutation({
    mutationFn: async (dto: CreateAccountDTO) => {
      const payload = sanitize({
        name: dto.name,
        currency: dto.currency,
        balance: dto.balance,
        type: dto.type,
        cardNumber: dto.cardNumber || undefined,
        iban: dto.iban || undefined,
        bankName: dto.bankName || undefined,
        providerName: dto.providerName || undefined,
        color: dto.color,
        icon: dto.icon,
        isDisplayedOnSidebar: dto.isDisplayedOnSidebar,
      });

      const raw = await accountService.create(payload as CreateAccountDTO);
      return rebuildAccountModel(raw);
    },
    onSuccess: (next) => {
      upsertCache(next);
      toast.success('Account created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create account', { description: error.message || 'Unexpected error.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (args: { id: number; diff: UpdateAccountDTO }) => {
      const payload = sanitize(args.diff as UpdateAccountDTO);
      const raw = await accountService.update(args.id, payload as UpdateAccountDTO);
      return rebuildAccountModel(raw);
    },
    onSuccess: (next) => {
      upsertCache(next);
      toast.success('Account updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update account', { description: error.message || 'Unexpected error.' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (args: { id: number; archivedAt: string | null }) => {
      const raw = await accountService.update(args.id, { archivedAt: args.archivedAt } as UpdateAccountDTO);
      return rebuildAccountModel(raw);
    },
    onSuccess: (next) => {
      upsertCache(next);
      toast.success(next.archivedAt ? 'Account archived' : 'Account unarchived');
    },
    onError: (error: Error) => {
      toast.error('Failed to update archive state', { description: error.message || 'Unexpected error.' });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async (args: { id: number; isDisplayedOnSidebar: boolean }) => {
      const raw = await accountService.update(args.id, {
        isDisplayedOnSidebar: args.isDisplayedOnSidebar,
      } as UpdateAccountDTO);
      return rebuildAccountModel(raw);
    },
    onSuccess: (next) => {
      upsertCache(next);
      toast.success(next.isDisplayedOnSidebar ? 'Pinned to sidebar' : 'Unpinned from sidebar');
    },
    onError: (error: Error) => {
      toast.error('Failed to update pin state', { description: error.message || 'Unexpected error.' });
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    archive: archiveMutation.mutateAsync,
    pin: pinMutation.mutateAsync,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isPinning: pinMutation.isPending,
  };
};
