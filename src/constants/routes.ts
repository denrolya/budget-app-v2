import { ArrowLeftRight, Home, Receipt, Wallet } from 'lucide-react';

export const ROUTES = {
  DASHBOARD: {
    path: '/dashboard',
    icon: Home
  },
  DAILY_LEDGER: {
    path: '/ledger',
    icon: Receipt
  },
  TRANSACTION_LIST: {
    path: '/transactions',
    icon: Receipt
  },
  ACCOUNT_LIST: {
    path: '/accounts',
    icon: Wallet
  },
  DEBT_LIST: {
    path: '/debts',
    icon: Wallet
  },
  TRANSFER_LIST: {
    path: '/transfers',
    icon: ArrowLeftRight
  }
};
