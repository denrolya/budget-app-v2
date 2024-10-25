import moment, { Moment } from 'moment';

import { Type as TransactionType, ConvertedValues } from '@/types/transaction';
import Transaction from '@/models/Transaction';
import { CURRENCIES } from '@/constants/currency';

export interface DebtRawData {
  id: number;
  debtor: string;
  currency: keyof typeof CURRENCIES;
  note: string;
  balance: number;
  transactions: Transaction[];
  convertedValues: ConvertedValues;
  createdAt: string;
  closedAt: string | null;
}

export default class Debt {
  id: number;
  debtor: string;
  currency: keyof typeof CURRENCIES;
  note: string;
  balance: number;
  transactions: Transaction[];
  convertedValues: Record<string, number>;
  createdAt: Moment;
  closedAt: Moment | null;

  constructor(data: DebtRawData) {
    this.id = data.id;
    this.debtor = data.debtor;
    this.currency = data.currency;
    this.note = data.note;
    this.balance = data.balance;
    this.transactions = data.transactions;
    this.convertedValues = data.convertedValues;
    this.createdAt = moment(data.createdAt);
    this.closedAt = data.closedAt ? moment(data.closedAt) : null;
  }

  get debtorWithCurrency(): string {
    return `[${CURRENCIES[this.currency].symbol}] ${this.debtor}`;
  }

  isClosed(): boolean {
    return this.closedAt !== null;
  }

  getLatestTransaction(): Transaction | null {
    if (this.transactions.length === 0) return null;
    return this.transactions.reduce((latest, current) =>
      current.executedAt.isAfter(latest.executedAt) ? current : latest
    );
  }

  getTotalPaid(): number {
    return this.transactions.reduce((total, transaction) => {
      if (transaction.type === TransactionType.Expense) {
        return total + transaction.amount;
      }
      return total - transaction.amount;
    }, 0);
  }

  setConvertedValues(convertedValues: ConvertedValues): void {
    this.convertedValues = convertedValues;
  }
}
