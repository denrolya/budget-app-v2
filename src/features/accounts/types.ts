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
  providerName?: string;

  color?: string;
  icon?: string;
  isDisplayedOnSidebar?: boolean;
};

export type UpdateAccountDTO = Partial<Omit<CreateAccountDTO, 'balance'>> & {
  balance?: number;
  archivedAt?: string | null;
};
