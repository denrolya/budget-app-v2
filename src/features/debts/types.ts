import type { RawTransactionDTO } from '@/features/transactions';

export interface DebtDTO {
  id: number;
  debtor: string;
  currency: string;
  note: string;
  balance: number;
  convertedValues: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
  closedAt: string | null;
  transactions: RawTransactionDTO[];
}
