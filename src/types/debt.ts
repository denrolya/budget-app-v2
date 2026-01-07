import { CURRENCY_CODE } from '@/constants/currency';
import { ConvertedValues, RawTransactionDTO } from '@/features/transactions';

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
