import moment, { Moment } from 'moment';

import { Transaction } from '@/models/transaction';

export interface TransferProps {
  id: number;
  rate: number;
  note: string;
  executedAt: string;
  fromExpense: Transaction;
  toIncome: Transaction;
  feeExpense: Transaction;
}

export class Transfer {
  id: number;
  rate: number;
  note: string;
  executedAt: Moment;
  fromExpense: Transaction;
  toIncome: Transaction;
  feeExpense: Transaction;

  constructor({
                id,
                rate,
                note,
                executedAt,
                fromExpense,
                toIncome,
                feeExpense,
              }: TransferProps) {
    this.id = id;
    this.rate = rate;
    this.note = note;
    this.executedAt = moment(executedAt);
    this.fromExpense = new Transaction(fromExpense);
    this.toIncome = new Transaction(toIncome);
    this.feeExpense = new Transaction(feeExpense);
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
