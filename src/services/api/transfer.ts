import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { TransferFilters } from '@/models/TransferFilters';
import { axiosFetcher } from '@/services/api';
import { Sorting } from '@/types/pagination';
import { RawTransactionDTO } from '@/types/transaction';

interface FetchTransfersParams {
  page: number;
  perPage: number;
  filters: TransferFilters;
  sort: Sorting;
}

interface TransferResponse {
  'hydra:member': any[];
  'hydra:totalItems': number;
}

export interface TransferDTO {
  '@id': string;
  '@type': string;
  id: number;
  from: {
    '@id': string;
    '@type': string;
    id: number;
    name: string;
    currency: string;
    color: string;
  };
  to: {
    '@id': string;
    '@type': string;
    id: number;
    name: string;
    currency: string;
    color: string;
  };
  amount: number;
  rate: number;
  fee: number;
  note: string;
  executedAt: string;
  transactions: RawTransactionDTO[];
}

export interface FetchResponse {
  items: TransferDTO[];
  totalItems: number;
}


const BASE_URL = '/api/transfers';

export const transferService = {
  async fetchTransfers({ page, perPage, filters, sort }: FetchTransfersParams): Promise<FetchResponse> {
    const url = this.buildUrl({ page, perPage, filters, sort });

    const result: TransferResponse = await axiosFetcher(url);

    return {
      items: result['hydra:member'],
      totalItems: result['hydra:totalItems'],
    };
  },

  buildUrl({ page, perPage, filters, sort }: FetchTransfersParams): string {
    const query = new URLSearchParams();

    query.set('page', String(page));
    query.set('perPage', String(perPage));

    if (filters.searchTerm) {
      query.set('searchTerm', filters.searchTerm);
    }

    if (filters.before) {
      query.set('executedAt[before]', filters.before.clone().endOf('day').toISOString());
    }

    if (filters.after) {
      query.set('executedAt[after]', filters.after.format(BACKEND_DATE_FORMAT));
    }

    if (filters.amountRange) {
      const [min, max] = filters.amountRange;
      if (!isNaN(min)) {
        query.append('amount[gte]', String(min));
      }
      if (!isNaN(max)) {
        query.append('amount[lte]', String(max));
      }
    }

    if (filters.accounts && filters.accounts.length > 0) {
      filters.accounts.forEach(account => query.append('accounts[]', account));
    }

    if (sort.field) {
      query.set('sortField', sort.field);
    }
    if (sort.direction) {
      query.set('sortDirection', sort.direction);
    }

    return `${BASE_URL}?${query.toString()}`;
  },
};
