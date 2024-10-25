import moment, { Moment } from 'moment';

import Debt from '@/models/Debt';
import { useAccounts, useCategories } from '@/contexts/FinanceData';
import Category from '@/models/Category';
import { ConvertedValues, Type, TransactionModelProps, RawTransactionDTO } from '@/types/transaction';
import Account from '@/models/Account';

export class Transaction {
  id: number | string | undefined;
  account: Account;
  amount: number;
  convertedValues: ConvertedValues;
  note: string;
  executedAt: Moment;
  category: Category;
  isDraft: boolean;
  debt?: undefined | Debt;
  compensations?: undefined | Transaction[];
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
                debt,
                compensations,
                type,
              }: TransactionModelProps) {
    this.id = id;
    this.account = account;
    this.amount = amount;
    this.convertedValues = convertedValues;
    this.note = note;
    this.executedAt = moment(executedAt);
    this.category = category;
    this.isDraft = isDraft;
    this.debt = debt;
    this.compensations = compensations?.map(
      (comp) =>
        new Transaction({
          id: comp.id!,
          account: comp.account!,
          amount: comp.amount!,
          convertedValues: comp.convertedValues!,
          note: comp.note!,
          executedAt: moment(comp.executedAt)!,
          category: comp.category!,
          isDraft: comp.isDraft!,
          compensations: comp.compensations || [],
          type: comp.type!,
        }),
    );
    this.type = type;
  }

  isTransfer(): boolean {
    return this.category.name === 'Transfer';
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

export const TransactionFactory = () => {
  const { list: categories } = useCategories();
  const accounts = useAccounts();

  if (!categories || !accounts) {
    throw new Error('Finance data is not available');
  }

  const createTransaction = (rawTransaction: RawTransactionDTO): Transaction => {
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
      executedAt: moment(rawTransaction.executedAt),
      compensations: rawTransaction.compensations?.map((comp) =>
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
        })
      )
    });
  };

  return { createTransaction };
};

export default Transaction;
