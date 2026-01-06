import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import BudgetingPage from '@/features/budget/ManagementPage';
import DailyLedgerPage from '@/features/daily-ledger/ListingPage';
import DashboardPage from '@/features/dashboard/Page';
import DebtsManagementPage from '@/features/debts/ManagementPage';
import LoginPage from '@/features/auth/LoginPage';
import SandboxPage from '@/features/sandbox/Page';
import LayoutV9 from '@/components/layout/LayoutV9';
import FinanceDataProvider from '@/contexts/FinanceData';
import RequireAuth from '@/components/common/RequireAuth';
import TransfersListPage from '@/features/transfers/ListingPage';
import TransactionsListPage from '@/features/transactions/ListingPage';
import CategoriesPage from '@/features/categories/ManagementPage';
import AccountsManagementPage from '@/features/accounts/ManagementPage';

const AppShell: React.FC = () => (
    <FinanceDataProvider>
      <LayoutV9>
        <Routes>
          <Route index element={<Navigate replace to="/ledger" />} />

          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<TransactionsListPage />} path="/transactions" />
          <Route element={<TransfersListPage />} path="/transfers" />
          <Route element={<DailyLedgerPage />} path="/ledger" />
          <Route element={<AccountsManagementPage />} path="/accounts/*" />
          <Route element={<DebtsManagementPage />} path="/debts" />
          <Route element={<SandboxPage />} path="/testing" />
          <Route element={<BudgetingPage />} path="/budget" />
          <Route element={<CategoriesPage />} path="/categories" />

          <Route element={<Navigate replace to="/ledger" />} path="*" />
        </Routes>
      </LayoutV9>
    </FinanceDataProvider>
  );

const Routing: React.FC = () => (
    <Routes>
      <Route element={<LoginPage />} path="/login" />

      {/* Auth-protected app */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />} path="/*" />
      </Route>

      {/* Fallback */}
      <Route element={<Navigate replace to="/ledger" />} path="*" />
    </Routes>
  );

export default Routing;
