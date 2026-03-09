export enum BankProvider {
  Monobank = 'monobank',
  Wise = 'wise',
}

export enum SyncMethod {
  Webhook = 'webhook',
  Polling = 'polling',
}

export interface BankIntegrationRaw {
  id: number;
  provider: BankProvider;
  isActive: boolean;
  syncMethod: SyncMethod | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface BankAccountData {
  externalId: string;
  name: string;
  currency: string;
  balance: number;
}

export interface CreateBankIntegrationDTO {
  provider: BankProvider;
  credentials?: Record<string, string>;
  syncMethod?: SyncMethod | null;
}

export type UpdateBankIntegrationDTO = Partial<{
  provider: BankProvider;
  credentials: Record<string, string>;
  isActive: boolean;
  syncMethod: SyncMethod | null;
}>;
