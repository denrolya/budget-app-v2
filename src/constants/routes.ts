import {
  CalendarDays,
  CreditCardIcon,
  FolderTree,
  Handshake,
  LayoutDashboard,
  PieChart,
  PiggyBank,
  Repeat,
  TestTube2,
} from 'lucide-react';

export const ROUTES = {
  DASHBOARD: {
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  DAILY_LEDGER: {
    path: '/ledger',
    icon: CalendarDays,
    label: 'Ledger',
  },
  TRANSACTION_LIST: {
    path: '/transactions',
    icon: CreditCardIcon,
    label: 'Transactions',
  },
  TRANSFER_LIST: {
    path: '/transfers',
    icon: Repeat,
    label: 'Transfers',
  },
  ACCOUNT_LIST: {
    path: '/accounts',
    icon: PiggyBank,
    label: 'Accounts',
  },
  DEBT_LIST: {
    path: '/debts',
    icon: Handshake,
    label: 'Debts',
  },
  CATEGORIES_PAGE: {
    path: '/categories',
    icon: FolderTree,
    label: 'Categories',
  },
  BUDGET_PAGE: {
    path: '/budget',
    icon: PieChart,
    label: 'Budget Planning',
  },
  SANDBOX_PAGE: {
    path: '/sandbox',
    icon: TestTube2,
    label: 'Sandbox Page',
  },
};
