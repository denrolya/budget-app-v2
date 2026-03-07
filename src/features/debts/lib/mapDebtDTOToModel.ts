import moment from 'moment';

import type { Account } from '@/features/accounts';
import type { Category } from '@/features/categories';
import { type RawTransactionDTO, Transaction } from '@/features/transactions';

import type { DebtDTO } from '../types';
import Debt from '../models/Debt';

const byId = <T extends { id: number }>(items: T[]) => {
  const map = new Map<number, T>();
  for (const it of items) map.set(it.id, it);
  return map;
};

const mapCompensation = (comp: any) =>
  new Transaction({
    id: comp.id!,
    account: comp.account!,
    amount: comp.amount!,
    convertedValues: comp.convertedValues!,
    note: comp.note!,
    executedAt: moment(comp.executedAt)!,
    category: comp.category!,
    isDraft: comp.isDraft!,
    compensations: comp.compensations,
    type: comp.type!,
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
      compensations: rawTx.compensations?.map(mapCompensation),
    });
  });

  return new Debt({
    ...dto,
    transactions,
  } as any);
};
