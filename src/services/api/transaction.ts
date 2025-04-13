import moment from 'moment';

import { Sorting } from '@/types/pagination';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import { api, axiosFetcher } from '@/services/api';
import { RawTransactionDTO, Type as TransactionType } from '@/types/transaction';

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

export const transactionService = {
  async fetchTransactions({
    page = 1,
    perPage = 30,
    filters,
    sort,
    excludeTransfers,
  }: FetchTransactionsParams): Promise<FetchResponse> {
    const url = this.buildUrl({ page, perPage, filters, sort });

    const result: TransactionResponse = await axiosFetcher(url);

    const filteredList = excludeTransfers ? result.list.filter((t: any) => !t.transfer?.id) : result.list;

    return {
      items: filteredList,
      totalItems: result.count,
      totalValue: result.totalValue,
    };
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
    sort: { field: string; direction: 'asc' | 'desc' };
  }): string {
    const query = new URLSearchParams();

    // Add pagination parameters
    query.set('page', String(page));
    query.set('perPage', String(perPage));

    // Add filter parameters
    if (filters.searchTerm) {
      query.set('searchTerm', filters.searchTerm);
    }

    if (filters.before) {
      query.set('before', filters.before.format(BACKEND_DATE_FORMAT));
    }

    if (filters.after) {
      query.set('after', filters.after.format(BACKEND_DATE_FORMAT));
    }

    if (filters.type) {
      query.set('type', filters.type);
    }

    if (filters.amountRange && filters.amountRange.length > 0) {
      const [min, max] = filters.amountRange;
      if (!isNaN(min)) {
        query.set('amount[gte]', String(min));
      }
      if (!isNaN(max)) {
        query.set('amount[lte]', String(max));
      }
    }

    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach((category) => query.append('categories[]', String(category)));
    }

    if (filters.excludedCategories && filters.excludedCategories.length > 0) {
      filters.excludedCategories.forEach((category) => query.append('excludedCategories[]', String(category)));
    }

    if (filters.accounts && filters.accounts.length > 0) {
      filters.accounts.forEach((account) => query.append('accounts[]', String(account)));
    }

    if (filters.withNestedCategories !== undefined) {
      query.set('withNestedCategories', filters.withNestedCategories ? '1' : '0');
    }

    if (filters.isDraft !== undefined) {
      query.set('isDraft', filters.isDraft ? '1' : '0');
    }

    // Add sorting parameters
    if (sort.field) {
      query.set('sortField', sort.field);
    }
    if (sort.direction) {
      query.set('sortDirection', sort.direction);
    }

    return `${BASE_URL}?${query.toString()}`;
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
};
