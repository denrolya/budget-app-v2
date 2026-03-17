import Account, { type AccountRawData } from '@/features/accounts/models/Account';
import type { ConvertedValues } from '@/features/transactions';
import { fetchCollection } from '@/lib/api';
import { api } from '@/services/api';

import { type CreateAccountDTO, type UpdateAccountDTO, Type as AccountType } from '../types';

type ExchangeRates = Record<string, number>;

const BASE_URL_V1 = '/api/accounts';
const BASE_URL_V2 = '/api/v2/accounts';

const withConvertedValues = (raw: AccountRawData, rates: ExchangeRates): Account => {
  const convertedValues: ConvertedValues = (() => {
    const converted: Record<string, number> = {};
    const base = rates[raw.currency];
    for (const [code, rate] of Object.entries(rates)) {
      converted[code] = base ? raw.balance * (rate / base) : raw.balance;
    }
    return converted;
  })();

  return new Account({ ...raw, convertedValues });
};

export const accountService = {
  async fetchList(rates: ExchangeRates): Promise<Account[]> {
    const rawAccounts = await fetchCollection<AccountRawData>(BASE_URL_V1);
    return rawAccounts.map((raw) => withConvertedValues(raw, rates));
  },

  async create(payload: CreateAccountDTO): Promise<AccountRawData> {
    const url = payload.type === AccountType.Basic ? BASE_URL_V1 : `${BASE_URL_V1}/${payload.type}`;
    const { data } = await api.post<AccountRawData>(url, payload);
    return data;
  },

  async update(id: number | string, payload: UpdateAccountDTO): Promise<AccountRawData> {
    const { data } = await api.put<AccountRawData>(`${BASE_URL_V1}/${id}`, payload);
    return data;
  },

  withConvertedValues,

  async fetchDailyStats(accountId: number, after: string, before: string): Promise<DailyStatsResponse> {
    const { data } = await api.get<DailyStatsResponse>(`${BASE_URL_V2}/${accountId}/daily-stats`, {
      params: { after, before },
    });
    return data;
  },

  async fetchGlobalDailyStats(filters: HeatmapFilters, after: string, before: string): Promise<DailyStatsResponse> {
    const params = new URLSearchParams({ after, before });
    filters.accounts?.forEach((id) => params.append('accounts[]', String(id)));
    filters.categories?.forEach((id) => params.append('categories[]', String(id)));
    filters.excludedCategories?.forEach((id) => params.append('excludedCategories[]', String(id)));
    if (filters.type) params.set('type', filters.type);
    filters.currencies?.forEach((c) => params.append('currencies[]', c));
    if (filters.isDraft !== undefined) params.set('isDraft', filters.isDraft ? '1' : '0');
    if (filters.note) params.set('note', filters.note);
    if (filters.amountGte !== undefined) params.set('amount[gte]', String(filters.amountGte));
    if (filters.amountLte !== undefined) params.set('amount[lte]', String(filters.amountLte));
    if (filters.affectingProfit !== undefined) params.set('affectingProfit', filters.affectingProfit ? '1' : '0');
    const { data } = await api.get<DailyStatsResponse>(`/api/v2/statistics/daily?${params}`);
    return data;
  },

  async fetchBalanceHistory(
    accountId: number,
    after: string,
    before: string,
    interval: string,
  ): Promise<BalanceHistoryResponse> {
    const { data } = await api.get<BalanceHistoryResponse>(`${BASE_URL_V2}/${accountId}/balance-history`, {
      params: { after, before, interval },
    });
    return data;
  },
};

export type BalanceHistoryPoint = { timestamp: number; balance: number };
export type BalanceHistoryResponse = { currency: string; data: BalanceHistoryPoint[] };

export type DailyStatsCurrencyValues = { income: number; expense: number };
export type DailyStatsDatum = { day: string; count: number; convertedValues: Record<string, DailyStatsCurrencyValues> };
export type DailyStatsResponse = { data: DailyStatsDatum[] };

/**
 * Filter params forwarded to the /statistics/daily endpoint.
 * Date range (after/before) is managed separately by HeatmapPanel.
 */
export interface HeatmapFilters {
  accounts?: number[];
  categories?: Array<string | number>;
  excludedCategories?: Array<string | number>;
  type?: string;
  currencies?: string[];
  isDraft?: boolean;
  note?: string;
  amountGte?: number;
  amountLte?: number;
  /** When true, only count transactions whose category.isAffectingProfit = true. */
  affectingProfit?: boolean;
}
