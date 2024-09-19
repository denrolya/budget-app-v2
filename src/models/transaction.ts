import moment, { Moment } from 'moment';

import { useAccounts, useCategories } from '@/contexts/FinanceData';
import Category from '@/models/category';
import Account from '@/models/account';

interface Account {
  icon: string;
  id: number;
  name: string;
  currency: string;
  color: string;
}

interface ConvertedValues {
  [key: string]: number;
}

export enum Type {
  Expense = 'expense',
  Income = 'income',
}

interface TransactionProps {
  id: number;
  account: Account;
  amount: number;
  convertedValues: ConvertedValues;
  note: string;
  executedAt: string;
  category: Category;
  isDraft: boolean;
  compensations: undefined | Partial<Transaction>[];
  type: Type;
}

export class Transaction {
  id: number;
  account: Account;
  amount: number;
  convertedValues: ConvertedValues;
  note: string;
  executedAt: Moment;
  category: Category;
  isDraft: boolean;
  compensations: Transaction[] | undefined;
  type: Type;

  constructor({
                id,
                account,
                amount,
                convertedValues,
                note,
                executedAt,
                category,
                isDraft,
                compensations,
                type,
              }: TransactionProps) {
    this.id = id;
    this.account = account;
    this.amount = amount;
    this.convertedValues = convertedValues;
    this.note = note;
    this.executedAt = moment(executedAt);
    this.category = category;
    this.isDraft = isDraft;
    // Recursively instantiate compensations as transactions
    this.compensations = compensations?.map(
      (comp) =>
        new Transaction({
          id: comp.id!,
          account: comp.account!,
          amount: comp.amount!,
          convertedValues: comp.convertedValues!,
          note: comp.note!,
          executedAt: comp.executedAt!,
          category: comp.category!,
          isDraft: comp.isDraft!,
          compensations: comp.compensations || [],
          type: comp.type!,
        }),
    );
    this.type = type;
  }

  isExpense(): boolean {
    return this.type === Type.Expense;
  }

  isIncome(): boolean {
    return this.type === Type.Income;
  }

  toString(): string {
    return `Transaction ${this.id}: ${this.type} of ${this.amount} ${this.account.currency} (${this.category.name})`;
  }
}

interface RawTransaction {
  id: number;
  account: {
    id: number;
  };
  amount: number;
  convertedValues: ConvertedValues;
  note: string;
  executedAt: string;
  category: {
    id: number;
  };
  isDraft: boolean;
  compensations: RawTransaction[];
  type: Type;
}

export const TransactionFactory = () => {
  const { list: categories } = useCategories();
  const accounts = useAccounts();

  if (!categories || !accounts) {
    throw new Error('Finance data is not available');
  }

  const createTransaction = (rawTransaction: RawTransaction): Transaction => {
    const account = accounts.find((acc: Account) => acc.id === rawTransaction.account.id);
    const category = categories.find((cat: Category) => cat.id === rawTransaction.category.id);

    if (!account) {
      throw new Error(`Account with ID ${rawTransaction.account.id} not found`);
    }

    if (!category) {
      throw new Error(`Category with ID ${rawTransaction.category.id} not found`);
    }

    return new Transaction({
      ...rawTransaction,
      account,
      category,
      compensations: rawTransaction.compensations?.map((comp) =>
        createTransaction({
          id: comp.id!,
          account: comp.account!,
          amount: comp.amount!,
          convertedValues: comp.convertedValues!,
          note: comp.note!,
          executedAt: comp.executedAt!,
          category: comp.category!,
          isDraft: comp.isDraft!,
          compensations: comp.compensations || [],
          type: comp.type!,
        })
      )
    });
  };

  return { createTransaction };
};
