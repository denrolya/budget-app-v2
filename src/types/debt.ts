import { CURRENCY_CODE } from '@/constants/currency';
import { ConvertedValues, RawTransactionDTO } from '@/types/transaction';

export interface DebtDTO {
  id: number;
  debtor: string;
  currency: CURRENCY_CODE;
  note: string;
  balance: number;
  transactions: RawTransactionDTO[];
  convertedValues: ConvertedValues;
  createdAt: string;
  closedAt: string | null;
}
