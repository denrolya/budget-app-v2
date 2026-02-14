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
};
