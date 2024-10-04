import moment, { Moment } from 'moment';

import { CURRENCIES } from '@/constants/currency';

export enum AccountType {
  Bank = 'bank',
  Cash = 'cash',
  Internet = 'internet',
  Other = 'other',
}

export const ACCOUNT_TYPES_ORDER: AccountType[] = [
  AccountType.Bank,
  AccountType.Cash,
  AccountType.Internet,
  AccountType.Other,
];

const colorScheme = {
  [AccountType.Bank]: {
    [CURRENCIES.EUR.code]: '#33CCFF',
    [CURRENCIES.USD.code]: '#66FF66',
    [CURRENCIES.UAH.code]: '#FFDD55',
    [CURRENCIES.HUF.code]: '#FF6347',
    [CURRENCIES.BTC.code]: '#9932CC',
  },
  [AccountType.Cash]: {
    [CURRENCIES.EUR.code]: '#0099CC',
    [CURRENCIES.USD.code]: '#32CD32',
    [CURRENCIES.UAH.code]: '#FFD100',
    [CURRENCIES.HUF.code]: '#B22222',
    [CURRENCIES.BTC.code]: '#4B0082',
  },
  [AccountType.Internet]: {
    [CURRENCIES.EUR.code]: '#006080',
    [CURRENCIES.USD.code]: '#228B22',
    [CURRENCIES.UAH.code]: '#CCAC00',
    [CURRENCIES.HUF.code]: '#8B0000',
    [CURRENCIES.BTC.code]: '#301934',
  },
  [AccountType.Other]: {
    [CURRENCIES.EUR.code]: '#66CCCC',
    [CURRENCIES.USD.code]: '#99FF99',
    [CURRENCIES.UAH.code]: '#FFEB99',
    [CURRENCIES.HUF.code]: '#D2691E',
    [CURRENCIES.BTC.code]: '#B57EDC',
  },
};

export interface AccountRawData {
  id: number;
  type: AccountType;
  createdAt: string;
  updatedAt: string;
  name: string;
  currency: keyof typeof CURRENCIES;
  balance: number;
  archivedAt?: string | null;
  convertedValues?: Record<string, number>;
}

export default class Account {
  id: number;
  type: AccountType;
  createdAt: Moment;
  updatedAt: Moment;
  name: string;
  currency: keyof typeof CURRENCIES;
  balance: number;
  archivedAt?: Moment | null;
  color: string;
  convertedValues?: Record<string, number>;

  constructor(data: AccountRawData) {
    this.id = data.id;
    this.type = data.type;
    this.createdAt = moment(data.createdAt);
    this.updatedAt = moment(data.updatedAt);
    this.name = data.name;
    this.currency = data.currency;
    this.balance = data.balance;
    this.archivedAt = data.archivedAt ? moment(data.archivedAt) : null;
    this.color = colorScheme[this.type][this.currency];
    this.convertedValues = data.convertedValues || undefined;
  }

  get nameWithCurrency(): string {
    return `[${CURRENCIES[this.currency].symbol}] ${this.name}`;
  }

  isArchived(): boolean {
    return this.archivedAt !== null;
  }

  setConvertedValues(convertedValues: Record<string, number>): void {
    this.convertedValues = convertedValues;
  }
}
