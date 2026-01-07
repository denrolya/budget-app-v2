import { axiosFetcher, api } from '@/services/api';
import Account, { AccountRawData } from '@/features/accounts/models/Account';
import type { ConvertedValues } from '@/features/transactions';

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

  async update(id: number | string, diff: Partial<Account>): Promise<AccountRawData> {
    return api.put<AccountRawData>(`${BASE_URL_V1}/${id}`, diff).then((res) => res.data);
  },

  // optional helper if you need it elsewhere
  withConvertedValues,
};
