import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { type TransferFilters } from '@/features/transfers/models/TransferFilters';
import type { TransferDTO } from '@/features/transfers/types';
import type { HydraCollection } from '@/types/api';
import { axiosFetcher } from '@/services/api';
import { type Sorting } from '@/types/pagination';

interface FetchTransfersParams {
  page: number;
  perPage: number;
  filters: TransferFilters;
  sort: Sorting;
}

export interface FetchTransfersResponse {
  items: TransferDTO[];
  totalItems: number;
}

type TransferResponse = HydraCollection<TransferDTO>;

const BASE_URL = '/api/transfers';

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const appendArray = (query: URLSearchParams, key: string, values: Array<string | number>) => {
  for (const v of values) query.append(key, String(v));
};

const buildQueryParams = ({ page, perPage, filters, sort }: FetchTransfersParams): URLSearchParams => {
  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('perPage', String(perPage));

  if (filters.searchTerm) query.set('note', filters.searchTerm);

  if (filters.before) {
    // preserve your original semantics: inclusive "before end of day"
    query.set('executedAt[before]', filters.before.clone().endOf('day').toISOString());
  }

  if (filters.after) {
    // preserve your original semantics: BACKEND_DATE_FORMAT
    query.set('executedAt[after]', filters.after.format(BACKEND_DATE_FORMAT));
  }

  if (Array.isArray(filters.amountRange) && filters.amountRange.length > 0) {
    const [min, max] = filters.amountRange;

    if (isFiniteNumber(min)) query.append('amount[gte]', String(min));
    if (isFiniteNumber(max)) query.append('amount[lte]', String(max));
  }

  if (Array.isArray(filters.accounts) && filters.accounts.length > 0) {
    appendArray(query, 'accounts[]', filters.accounts as Array<string | number>);
  }

  if (sort.field) query.set('sortField', sort.field);
  if (sort.direction) query.set('sortDirection', sort.direction);

  return query;
};

const buildUrl = (base: string, query: URLSearchParams): string => {
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
};

export const transferService = {
  async fetchList(params: FetchTransfersParams): Promise<FetchTransfersResponse> {
    const url = buildUrl(BASE_URL, buildQueryParams(params));

    const result: TransferResponse = await axiosFetcher(url);

    return {
      items: result['hydra:member'],
      totalItems: result['hydra:totalItems'] ?? 0,
    };
  },

  buildUrl(params: FetchTransfersParams): string {
    return buildUrl(BASE_URL, buildQueryParams(params));
  },
};
