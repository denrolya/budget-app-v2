import { type Moment } from 'moment';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { type RawTransactionDTO } from '@/features/transactions';
import { type TransferDTO } from '@/features/transfers/types';
import { axiosFetcher } from '@/services/api';

export interface LedgerQueryParams {
  after?: Moment;
  before?: Moment;
  /** Narrows results: 'expense'|'income' returns only that tx type; 'transfer' returns only transfers; omit for all. */
  type?: 'expense' | 'income' | 'transfer';
  accounts?: number[];
  categories?: number[];
  debts?: number[];
  note?: string;
  page?: number;
  perPage?: number;
}

export type LedgerItemDTO = RawTransactionDTO | TransferDTO;

export interface LedgerResponse {
  list: LedgerItemDTO[];
  count: number;
  totalValue: number;
}

const BASE_URL = '/api/v2/ledger';

const appendArray = (query: URLSearchParams, key: string, values: number[]) => {
  for (const v of values) query.append(key, String(v));
};

const buildQueryParams = (params: LedgerQueryParams): URLSearchParams => {
  const query = new URLSearchParams();

  if (params.after) query.set('after', params.after.format(BACKEND_DATE_FORMAT));
  if (params.before) query.set('before', params.before.format(BACKEND_DATE_FORMAT));
  if (params.type) query.set('type', params.type);
  if (params.note) query.set('note', params.note);
  if (params.page) query.set('page', String(params.page));
  if (params.perPage) query.set('perPage', String(params.perPage));

  if (params.accounts?.length) appendArray(query, 'account[]', params.accounts);
  if (params.categories?.length) appendArray(query, 'category[]', params.categories);
  if (params.debts?.length) appendArray(query, 'debt[]', params.debts);

  return query;
};

export const ledgerService = {
  async fetchList(params: LedgerQueryParams): Promise<LedgerResponse> {
    const qs = buildQueryParams(params).toString();
    const url = qs ? `${BASE_URL}?${qs}` : BASE_URL;
    return axiosFetcher(url);
  },
};

/** Discriminator: item is a non-transfer Transaction DTO when it has a `type` field */
export const isTransactionDTO = (item: LedgerItemDTO): item is RawTransactionDTO =>
  'type' in item && ((item as RawTransactionDTO).type === 'income' || (item as RawTransactionDTO).type === 'expense');

/** Discriminator: item is a Transfer DTO when it has `from` and `to` */
export const isTransferDTO = (item: LedgerItemDTO): item is TransferDTO => 'from' in item && 'to' in item;

/** Build a stable query-key string from ledger params for TanStack Query */
export const buildLedgerQueryKey = (params: LedgerQueryParams): string => {
  const p = new URLSearchParams();
  if (params.after) p.set('after', params.after.format(BACKEND_DATE_FORMAT));
  if (params.before) p.set('before', params.before.format(BACKEND_DATE_FORMAT));
  if (params.type) p.set('type', params.type);
  if (params.note) p.set('note', params.note);
  if (params.page) p.set('page', String(params.page));
  if (params.perPage) p.set('perPage', String(params.perPage));
  if (params.accounts?.length) p.set('accounts', params.accounts.slice().sort().join(','));
  if (params.categories?.length) p.set('categories', params.categories.slice().sort().join(','));
  if (params.debts?.length) p.set('debts', params.debts.slice().sort().join(','));
  return p.toString();
};
