import {
  ArrowLeftRight,
  CalendarDays,
  FileText,
  FolderTree,
  Handshake,
  LayoutDashboard,
  Layers,
  PiggyBank,
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
    icon: FileText,
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
    icon: FolderTree,
    label: 'Categories',
  },
  BUDGET_PAGE: {
    path: '/budget',
    icon: PiggyBank,
    label: 'Budget Planning',
  },
  BUCKETS_PAGE: {
    path: '/buckets',
    icon: Layers,
    label: 'Buckets',
  },
  SANDBOX_PAGE: {
    path: '/sandbox',
    icon: TestTube2,
    label: 'Sandbox Page',
  },
};
