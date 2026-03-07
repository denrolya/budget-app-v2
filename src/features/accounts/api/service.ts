import Account, { AccountRawData } from '@/features/accounts/models/Account';
import type { ConvertedValues } from '@/features/transactions';
import { api, axiosFetcher } from '@/services/api';

import { CreateAccountDTO, UpdateAccountDTO, Type as AccountType } from '../types';

type ExchangeRates = Record<string, number>;

const BASE_URL_V1 = '/api/accounts';
const BASE_URL_V2 = '/api/v2/account';

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
    const rawAccounts: AccountRawData[] = await axiosFetcher(BASE_URL_V2);
    return rawAccounts.map((raw) => withConvertedValues(raw, rates));
  },

  async create(payload: CreateAccountDTO): Promise<AccountRawData> {
    const url = payload.type === AccountType.Basic ? BASE_URL_V1 : `${BASE_URL_V1}/${payload.type}`;
    const { data } = await api.post<AccountRawData>(url, payload);
    return data;
  },

  async update(id: number | string, payload: UpdateAccountDTO): Promise<AccountRawData> {
    const { data } = await api.put<AccountRawData>(
      `${BASE_URL_V1}/${id}`,
      payload,
    );
    return data;
  },

  withConvertedValues,

  async fetchDailyStats(accountId: number, after: string, before: string): Promise<DailyStatsResponse> {
    const { data } = await api.get<DailyStatsResponse>(
      `${BASE_URL_V2}/${accountId}/daily-stats`,
      { params: { after, before } },
    );
    return data;
  },

  async fetchGlobalDailyStats(
    accountIds: number[],
    after: string,
    before: string,
    affectingProfit = false,
  ): Promise<DailyStatsResponse> {
    const params = new URLSearchParams({ after, before });
    accountIds.forEach((id) => params.append('accounts[]', String(id)));
    if (affectingProfit) params.set('affectingProfit', '1');
    const { data } = await api.get<DailyStatsResponse>(`/api/v2/statistics/daily?${params}`);
    return data;
  },

  async fetchBalanceHistory(
    accountId: number,
    after: string,
    before: string,
    interval: string,
  ): Promise<BalanceHistoryResponse> {
    const { data } = await api.get<BalanceHistoryResponse>(
      `${BASE_URL_V2}/${accountId}/balance-history`,
      { params: { after, before, interval } },
    );
    return data;
  },
};

export type BalanceHistoryPoint = { timestamp: number; balance: number };
export type BalanceHistoryResponse = { currency: string; data: BalanceHistoryPoint[] };

export type DailyStatsCurrencyValues = { income: number; expense: number };
export type DailyStatsDatum = { day: string; count: number; convertedValues: Record<string, DailyStatsCurrencyValues> };
export type DailyStatsResponse = { data: DailyStatsDatum[] };
