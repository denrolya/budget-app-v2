import moment, { Moment } from 'moment';

interface Account {
  icon: string;
  id: number;
  name: string;
  currency: string;
  color: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
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
