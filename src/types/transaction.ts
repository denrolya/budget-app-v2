import { Moment } from 'moment';

import Account from '@/models/Account';
import Category from '@/models/Category';

export interface ConvertedValues {
  [key: string]: number;
}

export enum Type {
  Expense = 'expense',
  Income = 'income',
}

export interface RawTransactionDTO {
  id: number;
  account: Account;
  amount: number;
  convertedValues: ConvertedValues;
  note: string;
  executedAt: string;
  category: Category;
  isDraft: boolean;
  compensations?: undefined | Partial<RawTransactionDTO>[];
  type: Type;
}

export interface TransactionModelProps {
  id: number;
  account: Account;
  amount: number;
  convertedValues: ConvertedValues;
  note: string;
  executedAt: Moment | string;
  category: Category;
  isDraft: boolean;
  debt?: object;
  compensations: undefined | Partial<TransactionModelProps>[];
  type: Type;
}
