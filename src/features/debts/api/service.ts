import { api } from '@/services/api';

import { type DebtDTO, type DebtWriteDTO } from '../types';

const BASE = '/api/debts';
const LIST_ENDPOINT = '/api/v2/debt';

export const debtService = {
  async fetchList(opts?: { withClosed?: boolean }): Promise<DebtDTO[]> {
    const withClosed = opts?.withClosed;

    const { data } = await api.get(LIST_ENDPOINT, {
      params: withClosed ? { withClosed: true } : undefined,
    });

    return data as DebtDTO[];
  },

  async create(payload: DebtWriteDTO): Promise<DebtDTO> {
    const res = await api.post(BASE, payload);
    return res.data as DebtDTO;
  },

  async update(id: number, payload: Partial<DebtWriteDTO>): Promise<DebtDTO> {
    const res = await api.put(`${BASE}/${id}`, payload);
    return res.data as DebtDTO;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },
};

export default debtService;
