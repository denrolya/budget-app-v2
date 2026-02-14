import type { RawTransactionDTO } from '@/features/transactions';

export type DebtDTO = {
  id: number;
  debtor: string;
  currency: string;
  note?: string | null;
  balance?: string; // API says string (e.g. "0.0")
  createdAt?: string | null; // date-time
  closedAt?: string | null; // date-time
  transactions?: RawTransactionDTO[];
  // API returns more fields in item/jsonld; keep it flexible for mapper deps
  [k: string]: unknown;
};

export type DebtWriteDTO = {
  debtor: string;
  currency: string;
  note?: string | null;
  balance?: string; // string per spec
  createdAt?: string | null;
  closedAt?: string | null;
};
