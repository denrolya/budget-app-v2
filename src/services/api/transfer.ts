import moment from 'moment';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { TransferFilters } from '@/models/TransferFilters.ts';
import { axiosFetcher } from '@/services/api';
import { TransactionDTO } from '@/services/api/transaction.ts';

interface FetchTransfersParams {
  page: number;
  perPage: number;
  filters: TransferFilters;
  sort: { field: string; direction: 'asc' | 'desc' };
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
  transactions: TransactionDTO[];
}

export interface FetchResponse {
  list: TransferDTO[];
  count: number;
}


const BASE_URL = '/api/transfers';

export const transferService = {
  async fetchTransfers({ page, perPage, filters, sort }: FetchTransfersParams): Promise<FetchResponse> {
    const url = this.buildUrl({ page, perPage, filters, sort });

    const result: TransferResponse = await axiosFetcher(url);

    return {
      list: result['hydra:member'],
      count: result['hydra:totalItems'],
    };
  },

  buildUrl({ page, perPage, filters, sort }: FetchTransfersParams): string {
    const query = new URLSearchParams();

    const addParam = (key: string, value: unknown) => {
      if (value == null || (Array.isArray(value) && value.length === 0)) return;

      if (Array.isArray(value)) {
        if (key === 'accounts') {
          value.forEach((item: string | number) => query.append('from.id[]', String(item)));
          value.forEach((item: string | number) => query.append('to.id[]', String(item)));
        } else {
          value.forEach((item) => query.append(`${key}[]`, String(item)));
        }
      } else if (typeof value === 'boolean') {
        query.set(key, value ? '1' : '0');
      } else if (moment.isMoment(value)) {
        query.set(`executedAt[${key}]`, key === 'before' ? value.clone().endOf('day').toISOString() : value.format(BACKEND_DATE_FORMAT));
      } else {
        query.set(key, String(value));
      }
    };

    addParam('perPage', perPage);
    addParam('page', page);

    Object.entries(filters).forEach(([key, value]) => addParam(key, value));

    addParam('sortField', sort.field);
    addParam('sortDirection', sort.direction);

    return `${BASE_URL}?${query.toString()}`;
  },
};
