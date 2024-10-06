import moment from 'moment';
import { z } from 'zod';

import { formSchema } from '@/components/features/transactions/Form.tsx';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import Transaction, { Type as TransactionType } from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import { api, axiosFetcher } from '@/services/api';

interface FetchTransactionsParams {
  page: number;
  perPage: number;
  filters: TransactionFilters;
  sort: { field: string; direction: 'asc' | 'desc' };
  excludeTransfers: boolean;
}

export interface TransactionDTO {
  id: number | string;
  account: {
    icon: string;
    id: number | string;
    name: string;
    currency: string;
    color: string;
  };
  amount: number;
  convertedValues: {
    BTC: number;
    EUR: number;
    HUF: number;
    UAH: number;
    USD: number;
  };
  note: string;
  executedAt: string;
  category: {
    id: number | string;
    name: string;
    icon: string;
    color: string | null;
  };
  isDraft: boolean;
  transfer: {
    id: number;
  } | undefined;
  compensations: TransactionDTO[] | undefined;
  type: 'expense' | 'income'; // Assuming these are the possible types
}

interface TransactionResponse {
  list: TransactionDTO[];
  count: number;
}

interface CompensationData {
  id?: string;
  account: string | number;
  amount: number;
  executedAt: Date | string;
}

export interface FetchResponse {
  list: TransactionDTO[];
  count: number;
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

    const filteredList = excludeTransfers
      ? result.list.filter((t: any) => !t.transfer?.id)
      : result.list;

    return {
      list: filteredList,
      count: result.count,
    };
  },

  buildUrl({ page, perPage, filters, sort }: {
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
      filters.categories.forEach(category => query.append('categories[]', String(category)));
    }

    if (filters.excludedCategories && filters.excludedCategories.length > 0) {
      filters.excludedCategories.forEach(category => query.append('excludedCategories[]', String(category)));
    }

    if (filters.accounts && filters.accounts.length > 0) {
      filters.accounts.forEach(account => query.append('accounts[]', String(account)));
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

  formatData(values: z.infer<typeof formSchema>, existingData?: Transaction) {
    return {
      account: values.account,
      amount: values.amount.toString(),
      category: values.category,
      executedAt: moment(values.executedAt).toISOString(),
      isDraft: values.isDraft ?? false,
      note: values.note || '',
      type: values.type,
      compensations: this.formatCompensations(values, existingData),
    };
  },

  formatCompensations(values: z.infer<typeof formSchema>, existingData?: Transaction) {
    return values.compensations?.map((comp: CompensationData, index: number) => {
      const existingComp = existingData?.compensations?.[index];
      return {
        id: existingComp ? `api/transactions/${existingComp.id}` : undefined,
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

  createTransaction(data: z.infer<typeof formSchema>) {
    return api.post(`/api/transactions/${data.type}`, this.formatData(data));
  },

  updateTransaction(id: string | number, updates: z.infer<typeof formSchema>, originalTransaction: Transaction) {
    return api.put(`/api/transactions/${id}`, this.formatData(updates, originalTransaction));
  },

  deleteTransaction(id: string | number) {
    return api.delete(`/api/transactions/${id}`);
  },
};
