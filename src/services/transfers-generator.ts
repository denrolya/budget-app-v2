import moment from 'moment';

import { Transfer, TransferProps } from '@/models/transfer';
import { Transaction, Type } from '@/models/transaction';

const accounts: { name: string; currency: string; type: string }[] = [
  { name: 'Zen EUR', currency: 'EUR', type: 'internet' },
  { name: 'Wise EUR', currency: 'EUR', type: 'bank' },
  { name: 'Mono UAH', currency: 'UAH', type: 'bank' },
  { name: 'Cash HUF', currency: 'HUF', type: 'cash' },
  { name: 'Cash EUR', currency: 'EUR', type: 'cash' },
];

const getRandomAccount = (): { name: string; currency: string; type: string } => accounts[Math.floor(Math.random() * accounts.length)];

const generateMockTransaction = (id: number, type: Type, categoryName: string, date: string, amount?: number): Transaction => {
  const transactionAmount = amount ?? Math.floor(Math.random() * 1000) + 1; // Use provided amount or generate a random amount
  const account = getRandomAccount();
  const executedAt = moment(date).set({
    hour: Math.floor(Math.random() * 24),
    minute: Math.floor(Math.random() * 60),
    second: Math.floor(Math.random() * 60),
  }).toISOString();

  return new Transaction({
    id,
    account: {
      icon: 'mock-icon',
      id: id,
      name: account.name,
      currency: account.currency,
      color: '#0000FF',
    },
    amount: transactionAmount,
    convertedValues: { USD: transactionAmount },
    note: '',
    executedAt,
    category: {
      id: id,
      name: categoryName,
      icon: 'mock-icon',
    },
    isDraft: false,
    compensations: [],
    type,
  });
};

export const generateTransfers = (count: number, date?: string, feeProbability: number = 0.5): Transfer[] => {
  const transfers: Transfer[] = [];
  const targetDate = date || moment().format('YYYY-MM-DD');

  for (let i = 0; i < count; i++) {
    const id = i + 1;
    const fromExpense = generateMockTransaction(id, Type.Expense, 'Transfer', targetDate);
    const rate = Math.random() * 10;
    const toIncome = generateMockTransaction(id + 1000, Type.Income, 'Transfer', targetDate, fromExpense.amount * rate);

    let feeExpense: Transaction | undefined = undefined;
    if (Math.random() < feeProbability) {
      const feeAmount = Math.floor(Math.random() * fromExpense.amount * 0.2);
      feeExpense = generateMockTransaction(id + 2000, Type.Expense, 'Transfer Fee', targetDate, feeAmount);
    }

    const transferProps: TransferProps = {
      id,
      rate,
      note: '',
      executedAt: fromExpense.executedAt,
      fromExpense,
      toIncome,
      feeExpense: feeExpense || generateMockTransaction(id + 2000, Type.Expense, 'Transfer Fee', targetDate, 0),
    };

    transfers.push(new Transfer(transferProps));
  }

  return transfers;
};
