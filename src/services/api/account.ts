import { axiosFetcher, api } from '@/services/api';
import Account, { AccountRawData } from '@/models/Account';
import { ConvertedValues } from '@/types/transaction';

type ExchangeRates = Record<string, number>;

const BASE_URL_V1 = '/api/accounts';
const BASE_URL_V2 = '/api/v2/account';

export const accountService = {
  /**
   * Fetches accounts and maps them into Account models
   * with convertedValues using provided exchange rates.
   */
  fetchList: async (rates: ExchangeRates): Promise<Account[]> => {
    const rawAccounts: AccountRawData[] = await axiosFetcher(BASE_URL_V2);

    return rawAccounts.map((raw) => {
      const convertedValues: ConvertedValues = (() => {
        const converted: Record<string, number> = {};
        const base = rates[raw.currency];
        Object.entries(rates).forEach(([code, rate]) => {
          converted[code] = base ? raw.balance * (rate / base) : raw.balance;
        });
        return converted;
      })();

      return new Account({
        ...raw,
        convertedValues,
      });
    });
  },
  /**
   * Updates an account by sending only the changed fields (diff).
   * Returns the updated AccountRawData from the server.
   */
  update: (id: number | string, diff: Partial<Account>): Promise<AccountRawData> =>
    api.put<AccountRawData>(`${BASE_URL_V1}/${id}`, diff).then((res) => res.data),
};
