import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import { api, axiosFetcher } from '@/services/api';

import { Sorting } from '@/types/pagination';
import { RawTransactionDTO, Type as TransactionType } from '@/types/transaction';
import moment from 'moment';

interface FetchTransactionsParams {
  page: number;
  perPage: number;
  filters: TransactionFilters;
  sort: Sorting;
  excludeTransfers: boolean;
}

interface TransactionResponse {
  list: RawTransactionDTO[];
  count: number;
  totalValue: number;
}

interface CompensationData {
  id?: string;
  account: string | number;
  amount: number;
  executedAt: Date | string;
}

export interface FetchResponse {
  items: RawTransactionDTO[];
  totalItems: number;
  totalValue: number;
}

const BASE_URL = '/api/v2/transaction';

type SortDirection = 'asc' | 'desc';

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const appendArray = (query: URLSearchParams, key: string, values: Array<string | number>) => {
  for (const v of values) query.append(key, String(v));
};

/**
 * Single source of truth for mapping TransactionFilters => query params.
 * This is reused by list fetching and CSV export.
 */
const buildQueryParams = (args: {
  page?: number;
  perPage?: number;
  filters: TransactionFilters;
  sort?: { field?: string; direction?: SortDirection };
  /**
   * When true: include pagination/sort params.
   * When false: only filters (for export endpoints).
   */
  includePagingAndSort?: boolean;
}): URLSearchParams => {
  const { page, perPage, filters, sort, includePagingAndSort = true } = args;

  const query = new URLSearchParams();

  if (includePagingAndSort) {
    query.set('page', String(page ?? 1));
    query.set('perPage', String(perPage ?? 30));

    if (sort?.field) query.set('sortField', sort.field);
    if (sort?.direction) query.set('sortDirection', sort.direction);
  }

  // Filters
  if (filters.searchTerm) query.set('searchTerm', filters.searchTerm);

  if (filters.before) query.set('before', filters.before.format(BACKEND_DATE_FORMAT));
  if (filters.after) query.set('after', filters.after.format(BACKEND_DATE_FORMAT));

  if (filters.type) query.set('type', String(filters.type));

  if (Array.isArray(filters.amountRange) && filters.amountRange.length > 0) {
    const [min, max] = filters.amountRange;

    if (isFiniteNumber(min)) query.set('amount[gte]', String(min));
    if (isFiniteNumber(max)) query.set('amount[lte]', String(max));
  }

  if (Array.isArray(filters.categories) && filters.categories.length > 0) {
    appendArray(query, 'categories[]', filters.categories as Array<string | number>);
  }

  if (Array.isArray(filters.excludedCategories) && filters.excludedCategories.length > 0) {
    appendArray(query, 'excludedCategories[]', filters.excludedCategories as Array<string | number>);
  }

  if (Array.isArray(filters.accounts) && filters.accounts.length > 0) {
    appendArray(query, 'accounts[]', filters.accounts as Array<string | number>);
  }

  if (filters.withNestedCategories !== undefined) {
    query.set('withNestedCategories', filters.withNestedCategories ? '1' : '0');
  }

  if (filters.isDraft !== undefined) {
    query.set('isDraft', filters.isDraft ? '1' : '0');
  }

  return query;
};

const buildUrl = (base: string, query: URLSearchParams): string => {
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const csvFilenameFromFilters = (filters: TransactionFilters) => {
  const after = filters.after?.format('YYYY-MM-DD') ?? 'from';
  const before = filters.before?.format('YYYY-MM-DD') ?? 'to';
  return `transactions_${after}_${before}.csv`;
};

export const transactionService = {
  async fetchTransactions({
                            page = 1,
                            perPage = 30,
                            filters,
                            sort,
                            excludeTransfers,
                          }: FetchTransactionsParams): Promise<FetchResponse> {
    const query = buildQueryParams({ page, perPage, filters, sort, includePagingAndSort: true });
    const url = buildUrl(BASE_URL, query);

    const result: TransactionResponse = await axiosFetcher(url);

    // NOTE: count/totalValue returned by backend may include transfers; you currently filter list only.
    // Keeping your existing behavior unchanged.
    const list = excludeTransfers ? result.list.filter((t: any) => !t.transfer?.id) : result.list;

    return {
      items: list,
      totalItems: result.count,
      totalValue: result.totalValue,
    };
  },

  /**
   * Exports CSV using the same filters mapping as fetchTransactions.
   * Triggers a browser download.
   */
  async exportTransactionsCsv(filters: TransactionFilters): Promise<void> {
    const query = buildQueryParams({ filters, includePagingAndSort: false });
    const url = buildUrl(`${BASE_URL}/export.csv`, query);

    // Prefer raw axios instance to get Blob
    const response = await api.get(url, {
      responseType: 'blob',
      headers: {
        Accept: 'text/csv',
      },
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, csvFilenameFromFilters(filters));
  },

  formatData(values: Partial<RawTransactionDTO | Transaction>, existingData?: Transaction) {
    return {
      account: values.account instanceof Account ? values.account.id : values.account,
      amount: values?.amount?.toString(),
      category: values.category instanceof Category ? values.category.id : values.category,
      executedAt: moment(values.executedAt).toISOString(),
      isDraft: values.isDraft ?? false,
      note: values.note || '',
      type: values.type,
      compensations: this.formatCompensations(values, existingData),
      debt: values.debt,
    };
  },

  formatCompensations(values: Partial<RawTransactionDTO | Transaction>, existingData?: Transaction | undefined) {
    // @ts-expect-error CompensationData somehow is not a good type here
    return values.compensations?.map((comp: CompensationData, index: number) => {
      const existingComp = existingData?.compensations?.[index];
      return {
        id: existingComp?.id ? `api/transactions/${existingComp.id}` : undefined,
        account: comp.account,
        amount: comp.amount.toString(),
        category: 137,
        executedAt: moment(comp.executedAt).toISOString(),
        isDraft: false,
        note: `[Compensation]: ${values.note || existingData?.id}`,
        type: TransactionType.Income,
      };
    });
  },

  createTransaction(data: Partial<RawTransactionDTO | Transaction>) {
    return api.post(`/api/transactions/${data.type}`, this.formatData(data));
  },

  updateTransaction(
    id: string | number,
    updates: Partial<RawTransactionDTO | Transaction>,
    originalTransaction: Transaction,
  ) {
    return api.put(`/api/transactions/${id}`, this.formatData(updates, originalTransaction));
  },

  deleteTransaction(id: string | number) {
    return api.delete(`/api/transactions/${id}`);
  },

  buildUrl({
             page,
             perPage,
             filters,
             sort,
           }: {
    page: number;
    perPage: number;
    filters: TransactionFilters;
    sort: { field: string; direction: SortDirection };
  }): string {
    const query = buildQueryParams({ page, perPage, filters, sort, includePagingAndSort: true });
    return buildUrl(BASE_URL, query);
  },
};
