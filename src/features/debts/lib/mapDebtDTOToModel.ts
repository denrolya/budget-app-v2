import moment from 'moment';

import type { Account } from '@/features/accounts';
import type { Category } from '@/features/categories';
import { type RawTransactionDTO, Transaction } from '@/features/transactions';

import type { DebtDTO } from '../types';
import Debt, { type DebtRawData } from '../models/Debt';

const byId = <T extends { id: number }>(items: T[]) => {
  const map = new Map<number, T>();
  for (const it of items) map.set(it.id, it);
  return map;
};

const mapCompensation = (
  comp: Omit<RawTransactionDTO, 'compensations' | 'transfer' | 'debt'> & { account: Account; category: Category },
) =>
  new Transaction({
    id: comp.id,
    account: comp.account,
    amount: comp.amount,
    convertedValues: comp.convertedValues,
    note: comp.note,
    executedAt: moment(comp.executedAt),
    category: comp.category,
    isDraft: comp.isDraft,
    compensations: undefined,
    type: comp.type,
  });

export const mapDebtDTOToModel = (dto: DebtDTO, deps: { accounts: Account[]; categories: Category[] }): Debt => {
  const accountMap = byId(deps.accounts);
  const categoryMap = byId(deps.categories);

  const transactions = (dto.transactions ?? []).map((rawTx: RawTransactionDTO) => {
    const account = accountMap.get(rawTx.account.id);
    const category = categoryMap.get(rawTx.category.id);

    if (!account) throw new Error(`Debt ${dto.id}: account ${rawTx.account.id} not found`);
    if (!category) throw new Error(`Debt ${dto.id}: category ${rawTx.category.id} not found`);

    return new Transaction({
      ...rawTx,
      account,
      category,
      executedAt: moment(rawTx.executedAt),
      debt: (rawTx.debt ?? undefined) as Debt | undefined,
      compensations: rawTx.compensations?.map(
        mapCompensation as unknown as (
          comp: Omit<RawTransactionDTO, 'compensations' | 'transfer' | 'debt'>,
        ) => Transaction,
      ),
    });
  });

  return new Debt({
    ...dto,
    transactions,
    balance: Number(dto.balance ?? 0),
    convertedValues: (dto.convertedValues as Record<string, number>) ?? {},
    note: dto.note ?? '',
    createdAt: dto.createdAt ?? null,
    closedAt: dto.closedAt ?? null,
  } as DebtRawData);
};
