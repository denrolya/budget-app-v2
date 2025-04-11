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
  id: number;
  account: {
    id: number;
    icon: string;
    name: string;
    currency: string;
    color: string;
  };
  amount: number;
  convertedValues: ConvertedValues;
  note: string;
  executedAt: string;
  category: {
    id: number;
    name: string;
    icon: string;
    color: string | null;
  };
  isDraft: boolean;
  debt: any;
  transfer:
    | {
        id: number;
      }
    | undefined;
  compensations?: Omit<RawTransactionDTO, 'compensations' | 'transfer' | 'debt'>[];
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
  compensations?: Partial<TransactionModelProps>[];
  type: Type;
}
