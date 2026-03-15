import { type RawTransactionDTO } from '@/features/transactions';

export interface TransferAccountRefDTO {
  '@id': string;
  '@type': string;
  id: number;
  name: string;
  currency: string;
  color: string;
}

export interface TransferDTO {
  '@id': string;
  '@type': string;
  id: number;

  from: TransferAccountRefDTO;
  to: TransferAccountRefDTO;

  amount: number | string;
  rate: number | string;
  fee: number | string;
  note: string;
  executedAt: string;

  transactions: RawTransactionDTO[];
}

export type CreateTransferInput = {
  from: number;
  to: number;
  amount: number;
  /**
   * Canonical: TO per 1 FROM (same as your current form intent)
   */
  rate: number;

  fee?: number;
  feeAccount?: number;

  /**
   * Accepts either an ISO string or something moment can parse.
   * Your form currently uses datetime-local string; that’s fine.
   */
  executedAt: string;

  note?: string;
};

export type UpdateTransferInput = { id: number } & CreateTransferInput;
