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
  isDraft?: boolean;
  withNestedCategories?: boolean;
  currencies?: string[];
  amountGte?: number;
  amountLte?: number;
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

const appendArray = (query: URLSearchParams, key: string, values: number[] | string[]) => {
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
  if (params.currencies?.length) appendArray(query, 'currencies[]', params.currencies);
  if (params.isDraft !== undefined) query.set('isDraft', params.isDraft ? '1' : '0');
  if (params.withNestedCategories) query.set('withNestedCategories', '1');
  if (params.amountGte !== undefined) query.set('amount[gte]', String(params.amountGte));
  if (params.amountLte !== undefined) query.set('amount[lte]', String(params.amountLte));

  return query;
};

export const ledgerService = {
  async fetchList(params: LedgerQueryParams): Promise<LedgerResponse> {
    const qs = buildQueryParams(params).toString();
    const url = qs ? `${BASE_URL}?${qs}` : BASE_URL;
    return axiosFetcher(url);
  },
};

/** Discriminator: item is a non-transfer Transaction DTO when it has a `type` field of expense/income */
export const isTransactionDTO = (item: LedgerItemDTO): item is RawTransactionDTO =>
  'type' in item && ((item as RawTransactionDTO).type === 'income' || (item as RawTransactionDTO).type === 'expense');

/**
 * Discriminator: item is a Transfer DTO.
 * Transfers have a `transactions` array and no top-level `type` field.
 * We avoid relying on `from`/`to` since those Account relations may be
 * omitted by JMS Serializer when no Account properties match the active group.
 */
export const isTransferDTO = (item: LedgerItemDTO): item is TransferDTO =>
  'transactions' in item && Array.isArray((item as TransferDTO).transactions) && !('type' in item);

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
  if (params.currencies?.length) p.set('currencies', params.currencies.slice().sort().join(','));
  if (params.isDraft !== undefined) p.set('isDraft', String(params.isDraft));
  if (params.withNestedCategories) p.set('withNestedCategories', '1');
  if (params.amountGte !== undefined) p.set('amountGte', String(params.amountGte));
  if (params.amountLte !== undefined) p.set('amountLte', String(params.amountLte));
  return p.toString();
};
