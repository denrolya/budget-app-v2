import { axiosFetcher } from '@/services/api';

import type { DebtDTO } from '../types';

const ENDPOINT = '/api/v2/debt';

export const debtService = {
  async fetchList(): Promise<DebtDTO[]> {
    return axiosFetcher(ENDPOINT);
  },
};
