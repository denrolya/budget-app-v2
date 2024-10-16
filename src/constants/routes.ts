import {
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  Handshake,
  LayoutDashboard,
  PieChart,
  Receipt,
  Tags,
  TestTube2,
  Wallet,
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
    icon: Receipt,
    label: 'Transactions',
  },
  TRANSFER_LIST: {
    path: '/transfers',
    icon: ArrowLeftRight,
    label: 'Transfers',
  },
  ACCOUNT_LIST: {
    path: '/accounts',
    icon: Wallet,
    label: 'Accounts',
  },
  DEBT_LIST: {
    path: '/debts',
    icon: Handshake,
    label: 'Debts',
  },
  CATEGORIES_PAGE: {
    path: '/categories',
    icon: Tags,
    label: 'Categories',
  },
  BUDGET_PAGE: {
    path: '/budget',
    icon: PieChart,
    label: 'Budget Planning',
  },
  REPORTS_PAGE: {
    path: '/reports',
    icon: BarChart3,
    label: 'Reports',
  },
  TESTING_PAGE: {
    path: '/testing',
    icon: TestTube2,
    label: 'Testing Page',
  },
};
