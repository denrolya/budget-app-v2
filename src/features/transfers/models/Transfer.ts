import moment, { type Moment } from 'moment';

import { type Transaction } from '@/features/transactions';
import { CURRENCY_CODE } from '@/constants/currency';

export interface TransferProps {
  id: number;
  rate: number | string;
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
  feeExpenses: Transaction[];

  constructor({ id, rate, note, executedAt, transactions }: TransferProps) {
    this.id = id;
    this.rate = Number(rate);
    this.note = note;
    this.executedAt = moment(executedAt);
    this.fromExpense = transactions.find((t) => t.type === 'expense' && t.category.name === 'Transfer')!;
    this.toIncome = transactions.find((t) => t.type === 'income' && t.category.name === 'Transfer')!;
    this.feeExpenses = transactions.filter((t) => t.type === 'expense' && t.category.name === 'Transfer Fee');
  }

  /** Net amount sent from the source account (after fee-inclusion adjustment, if any). */
  get amount(): number {
    return this.fromExpense.amount;
  }

  toString(): string {
    return `Transfer ${this.id}: Rate ${this.rate}, executed on ${this.executedAt}`;
  }

  totalFees(): number {
    return this.feeExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  totalTransferAmount(): number {
    return this.toIncome.amount - this.fromExpense.amount - this.totalFees();
  }

  hasFee(): boolean {
    return this.feeExpenses.length > 0;
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
