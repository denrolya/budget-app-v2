import { ArrowLeftRight, LayoutDashboard, Handshake, CalendarDays, Receipt, Wallet } from 'lucide-react';

export const ROUTES = {
  DASHBOARD: {
    path: '/dashboard',
    icon: LayoutDashboard
  },
  DAILY_LEDGER: {
    path: '/ledger',
    icon: CalendarDays
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
    icon: Handshake
  },
  TRANSFER_LIST: {
    path: '/transfers',
    icon: ArrowLeftRight
  }
};
