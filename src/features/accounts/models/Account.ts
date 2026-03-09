import moment, { Moment } from 'moment';

import { CURRENCIES } from '@/constants/currency';
import type { BankIntegrationRaw } from '@/features/bank-integrations';

import { Type as AccountType } from '../types';

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
  isDisplayedOnSidebar: boolean;
  externalAccountId?: string | null;
  bankIntegration?: BankIntegrationRaw | null;
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
  isDisplayedOnSidebar: boolean;
  externalAccountId?: string | null;
  bankIntegration?: BankIntegrationRaw | null;

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
    this.isDisplayedOnSidebar = data.isDisplayedOnSidebar;
    this.externalAccountId = data.externalAccountId ?? null;
    this.bankIntegration = data.bankIntegration ?? null;
  }

  isPositive() {
    return this.balance > 0;
  }

  isNegative() {
    return this.balance < 0;
  }

  isEmpty() {
    return this.currency !== CURRENCIES.BTC.code ? this.balance.toFixed(0) === '0' : this.balance === 0;
  }

  get displayName(): string {
    return `${CURRENCIES[this.currency].symbol} ${this.name}`;
  }

  isArchived(): boolean {
    return this.archivedAt !== null;
  }

  setConvertedValues(convertedValues: Record<string, number>): void {
    this.convertedValues = convertedValues;
  }
}
