export enum Type {
  Bank = 'bank',
  Cash = 'cash',
  Internet = 'internet',
  Basic = 'basic',
}

export type CreateAccountDTO = {
  name: string;
  currency: string;
  balance: number;
  type: Type;

  cardNumber?: string;
  iban?: string;
  bankName?: string;

  isDisplayedOnSidebar?: boolean;
};

export type UpdateAccountDTO = Partial<Omit<CreateAccountDTO, 'balance'>> & {
  isDisplayedOnSidebar?: boolean;
  balance?: number;
  archivedAt?: string | null;
  bankIntegration?: string | null;
  externalAccountId?: string | null;
};
