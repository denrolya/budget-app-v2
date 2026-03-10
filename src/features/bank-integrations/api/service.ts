import { api } from '@/services/api';

import type { BankAccountData, BankIntegrationRaw, CreateBankIntegrationDTO, UpdateBankIntegrationDTO } from '../types';

const BASE_URL = '/api/bank-integrations';

export const bankIntegrationService = {
  async fetchList(): Promise<BankIntegrationRaw[]> {
    const { data } = await api.get<{ 'hydra:member': BankIntegrationRaw[] }>(BASE_URL);
    return data['hydra:member'];
  },

  async fetchOne(id: number): Promise<BankIntegrationRaw> {
    const { data } = await api.get<BankIntegrationRaw>(`${BASE_URL}/${id}`);
    return data;
  },

  async create(payload: CreateBankIntegrationDTO): Promise<BankIntegrationRaw> {
    const { data } = await api.post<BankIntegrationRaw>(BASE_URL, payload);
    return data;
  },

  async update(id: number, payload: UpdateBankIntegrationDTO): Promise<BankIntegrationRaw> {
    const { data } = await api.put<BankIntegrationRaw>(`${BASE_URL}/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  async fetchBankAccounts(id: number): Promise<BankAccountData[]> {
    const { data } = await api.get<BankAccountData[]>(`${BASE_URL}/${id}/accounts`);
    return data;
  },

  async sync(id: number, from?: string, to?: string): Promise<{ created: number }> {
    const { data } = await api.post<{ created: number }>(
      `${BASE_URL}/${id}/sync`,
      {},
      {
        params: { ...(from && { from }), ...(to && { to }) },
      },
    );
    return data;
  },

  async registerWebhook(id: number): Promise<{ webhookUrl: string }> {
    const { data } = await api.post<{ webhookUrl: string }>(`${BASE_URL}/${id}/register-webhook`, {});
    return data;
  },
};
