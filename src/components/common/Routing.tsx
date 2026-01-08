import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import LogoutRoute from '@/features/auth/components/LogoutRoute';
import RequireAuth from '@/components/common/RequireAuth';
import RequiredDataGate from '@/components/common/RequiredDataGate';
import LayoutV9 from '@/components/layout/LayoutV9';
import { AccountsManagementPage } from '@/features/accounts';
import { LoginPage } from '@/features/auth';
import BudgetingPage from '@/features/budget/ManagementPage';
import { CategoriesManagementPage } from '@/features/categories';
import DailyLedgerPage from '@/features/daily-ledger/ListingPage';
import DashboardPage from '@/features/dashboard/Page';
import { DebtsManagementPage } from '@/features/debts';
import SandboxPage from '@/features/sandbox/Page';
import { TransactionsListPage } from '@/features/transactions';
import { TransfersListPage } from '@/features/transfers';

const AppShell: React.FC = () => (
  <RequiredDataGate>
    <LayoutV9>
      <Routes>
        <Route index element={<Navigate replace to="/ledger" />} />

        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<TransactionsListPage />} path="/transactions" />
        <Route element={<TransfersListPage />} path="/transfers" />
        <Route element={<DailyLedgerPage />} path="/ledger" />
        <Route element={<AccountsManagementPage />} path="/accounts/*" />
        <Route element={<DebtsManagementPage />} path="/debts/*" />
        <Route element={<SandboxPage />} path="/testing" />
        <Route element={<BudgetingPage />} path="/budget" />
        <Route element={<CategoriesManagementPage />} path="/categories" />

        <Route element={<Navigate replace to="/ledger" />} path="*" />
      </Routes>
    </LayoutV9>
  </RequiredDataGate>
);

const Routing: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route element={<LoginPage />} path="/login" />
    <Route element={<LogoutRoute />} path="/logout" />

    {/* Protected */}
    <Route element={<RequireAuth />}>
      <Route element={<AppShell />} path="/*" />
    </Route>

    {/* Fallback */}
    <Route element={<Navigate replace to="/ledger" />} path="*" />
  </Routes>
);

export default Routing;
