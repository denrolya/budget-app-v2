import { Moment } from 'moment';

import Debt from '@/models/Debt';
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
  id: number | string | undefined;
  account: {
    icon: string;
    id: number | string;
    name: string;
    currency: string;
    color: string;
  };
  amount: number;
  convertedValues: ConvertedValues;
  note: string;
  executedAt: string;
  category: {
    id: number | string;
    name: string;
    icon: string;
    color: string | null;
  };
  isDraft: boolean;
  debt: any;
  transfer: {
    id: number;
  } | undefined;
  compensations: Partial<RawTransactionDTO>[] | undefined;
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
  debt?: Debt | undefined;
  compensations: undefined | Partial<TransactionModelProps>[];
  type: Type;
}
