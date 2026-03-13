import {
  CalendarDays,
  FolderTree,
  Handshake,
  Layers,
  LayoutDashboard,
  PiggyBank,
  Wallet,
} from 'lucide-react';

export const ROUTES = {
  DASHBOARD: {
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  LEDGER: {
    path: '/ledger',
    icon: CalendarDays,
    label: 'Ledger',
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

};
