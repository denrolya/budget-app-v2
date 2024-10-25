import moment, { Moment } from 'moment';

import Transaction from '@/models/Transaction';

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

  constructor({
                id,
                rate,
                note,
                executedAt,
                transactions,
              }: TransferProps) {
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
}

export default Transfer;
