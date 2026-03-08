import moment, { Moment } from 'moment';

import { Transaction } from '@/features/transactions';
import { CURRENCY_CODE } from '@/constants/currency';

export interface TransferProps {
  id: number;
  rate: number;
  note: string;
  executedAt: string;
  transactions: Transaction[];
}

export class Transfer {
  id: number;
  rate: number;
  note: string;
  executedAt: Moment;
  fromExpense: Transaction;
  toIncome: Transaction;
  feeExpense: Transaction | undefined;

  constructor({ id, rate, note, executedAt, transactions }: TransferProps) {
    this.id = id;
    this.rate = rate;
    this.note = note;
    this.executedAt = moment(executedAt);
    this.fromExpense = transactions.find((t) => t.type === 'expense' && t.category.name === 'Transfer')!;
    this.toIncome = transactions.find((t) => t.type === 'income' && t.category.name === 'Transfer')!;
    this.feeExpense = transactions.find((t) => t.type === 'expense' && t.category.name === 'Transfer Fee');
  }

  get amount(): number {
    return this.fromExpense.amount;
  }

  toString(): string {
    return `Transfer ${this.id}: Rate ${this.rate}, executed on ${this.executedAt}`;
  }

  totalTransferAmount(): number {
    return this.toIncome.amount - this.fromExpense.amount - (this.feeExpense?.amount || 0);
  }

  hasFee(): boolean {
    return !!this.feeExpense;
  }

  get displayRate(): number {
    const fromCurrency = this.fromExpense.account.currency;
    const toCurrency = this.toIncome.account.currency;

    if (
      (fromCurrency === CURRENCY_CODE.UAH &&
        [CURRENCY_CODE.USD, CURRENCY_CODE.EUR, CURRENCY_CODE.BTC].includes(toCurrency)) ||
      ([CURRENCY_CODE.USD, CURRENCY_CODE.EUR, CURRENCY_CODE.BTC].includes(fromCurrency) &&
        toCurrency === CURRENCY_CODE.UAH)
    ) {
      return fromCurrency === CURRENCY_CODE.UAH ? 1 / this.rate : this.rate;
    }

    if (
      (fromCurrency === CURRENCY_CODE.UAH && toCurrency === CURRENCY_CODE.HUF) ||
      (fromCurrency === CURRENCY_CODE.HUF && toCurrency === CURRENCY_CODE.UAH)
    ) {
      return fromCurrency !== CURRENCY_CODE.UAH ? this.rate * 1000 : (1 / this.rate) * 1000;
    }

    if (
      (fromCurrency === CURRENCY_CODE.HUF &&
        [CURRENCY_CODE.EUR, CURRENCY_CODE.USD, CURRENCY_CODE.BTC].includes(toCurrency)) ||
      ([CURRENCY_CODE.EUR, CURRENCY_CODE.USD, CURRENCY_CODE.BTC].includes(fromCurrency) &&
        toCurrency === CURRENCY_CODE.HUF)
    ) {
      return fromCurrency === CURRENCY_CODE.HUF ? 1 / this.rate : this.rate;
    }

    return this.rate;
  }
}

export default Transfer;
