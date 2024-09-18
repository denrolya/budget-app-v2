import moment from 'moment';

import { Transaction, Type } from '@/models/transaction';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface ConvertedValues {
  [key: string]: number;
}

const accounts: { name: string; currency: string; type: string }[] = [
  { name: 'Zen EUR', currency: 'EUR', type: 'internet' },
  { name: 'Wise EUR', currency: 'EUR', type: 'bank' },
  { name: 'Mono UAH', currency: 'UAH', type: 'bank' },
  { name: 'Cash HUF', currency: 'HUF', type: 'cash' },
  { name: 'Cash EUR', currency: 'EUR', type: 'cash' },
];

const categories: { [key: string]: string[] } = {
  income: ['Salary', 'Return', 'Compensation', 'Sell', 'Bonus'],
  expense: ['Food & Drinks', 'Housing', 'Health & Fitness', 'Shopping', 'Shoes', 'Entertainment', 'Alcohol'],
};

const getRandomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

const getRandomAmount = (currency: string): number => {
  const base = Math.random() * 1000;
  switch (currency) {
    case 'UAH':
      return Math.round(base * 36);
    case 'HUF':
      return Math.round(base * 350);
    case 'BTC':
      return parseFloat((base / 20000).toFixed(5));
    default:
      return parseFloat(base.toFixed(2));
  }
};

const generateConvertedValues = (amount: number, baseCurrency: string): ConvertedValues => {
  const rates: { [key: string]: number } = {
    EUR: 1,
    USD: 1.1,
    UAH: 40,
    HUF: 380,
    BTC: 0.00003,
  };
  const convertedValues: ConvertedValues = {};
  Object.keys(rates).forEach((currency) => {
    if (currency !== baseCurrency) {
      convertedValues[currency] = parseFloat((amount * (rates[currency] / rates[baseCurrency])).toFixed(2));
    }
  });
  return convertedValues;
};

const generateCompensations = (expenseAmount: number, expenseCurrency: string): Partial<Transaction>[] => {
  const compensations: Partial<Transaction>[] = [];
  let compensationTotal = 0;

  // Randomly decide the number of compensations (0 to 3 compensations)
  const numberOfCompensations = Math.floor(Math.random() * 4);

  for (let i = 0; i < numberOfCompensations; i++) {
    const compensationAmount = getRandomAmount(expenseCurrency) / 2; // Compensation amount is a random value less than expense
    compensationTotal += compensationAmount;
    compensations.push({
      id: 1000 + i, // Offset ID for compensations
      account: {
        icon: '🏦',
        id: 200 + i,
        name: 'Compensation Account',
        currency: expenseCurrency,
        color: '#FFAA33',
      },
      amount: compensationAmount,
      convertedValues: generateConvertedValues(compensationAmount, expenseCurrency),
      note: 'Compensation for expense',
      executedAt: new Date().toISOString(),
      category: {
        id: 300 + i,
        name: 'Compensation',
        icon: '🔄',
      },
      isDraft: false,
      compensations: [],
      type: Type.Income,
    });
  }

  return compensations;
};

export const generateTransactions = (numberOfTransactions: number = 1, date?: string, compensationProbability: number = 0.5): Transaction[] => {
  const transactions: Transaction[] = [];
  const targetDate = date || moment().format('YYYY-MM-DD');

  for (let i = 0; i < numberOfTransactions; i++) {
    const account = getRandomElement(accounts);
    const type: Type = Math.random() > 0.5 ? Type.Income : Type.Expense;
    const category: Category = {
      id: i + 1,
      name: getRandomElement(categories[type.toLowerCase()]), // Access correct category list based on type
      icon: type === Type.Income ? '📈' : '📉',
    };
    const amount = getRandomAmount(account.currency);
    let adjustedAmount = amount;
    const convertedValues = generateConvertedValues(adjustedAmount, account.currency);

    let compensations: undefined | Partial<Transaction>[] = type === Type.Income ? undefined : [];

    if (type === Type.Expense && Math.random() < compensationProbability) {
      compensations = generateCompensations(amount, account.currency);
      if (compensations.length > 0) {
        adjustedAmount -= compensations.reduce((sum, comp) => sum + (comp.amount || 0), 0);
      }
    }

    const executedAt = moment(targetDate).set({
      hour: Math.floor(Math.random() * 24),
      minute: Math.floor(Math.random() * 60),
      second: Math.floor(Math.random() * 60),
    }).toISOString();

    const transaction = new Transaction({
      id: i + 1,
      account: {
        icon: account.type === 'cash' ? '💵' : account.type === 'bank' ? '🏦' : '🌐',
        id: 1,
        name: account.name,
        currency: account.currency,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
      },
      amount: type === Type.Expense ? adjustedAmount : amount,
      convertedValues,
      note: `${type === Type.Income ? 'Received' : 'Paid'} for ${category.name}`,
      executedAt,
      category,
      isDraft: false,
      compensations,
      type,
    });

    transactions.push(transaction);
  }
  return transactions;
};
