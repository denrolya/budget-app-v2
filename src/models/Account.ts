import moment, { Moment } from 'moment';

import { CURRENCIES } from '@/constants/currency';
import { Type as AccountType } from '@/types/account';

export const ACCOUNT_TYPES_ORDER: AccountType[] = [
  AccountType.Bank,
  AccountType.Cash,
  AccountType.Internet,
  AccountType.Basic,
];

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
    this.color = `var(--account-${this.type.toLowerCase()}-${this.currency})`;
    this.convertedValues = data.convertedValues || undefined;
  }

  get nameWithCurrency(): string {
    return `[${CURRENCIES[this.currency].symbol}] ${this.name}`;
  }

  get displayName(): string {
    return `[${CURRENCIES[this.currency].symbol}] ${this.name}`;
  }

  isArchived(): boolean {
    return this.archivedAt !== null;
  }

  setConvertedValues(convertedValues: Record<string, number>): void {
    this.convertedValues = convertedValues;
  }
}
