import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import RequireAuth from '@/components/common/RequireAuth';
import RequiredDataGate from '@/components/common/RequiredDataGate';
import Layout from '@/components/layout/Layout';
import { AccountsManagementPage } from '@/features/accounts';
import { LoginPage } from '@/features/auth';
import LogoutRoute from '@/features/auth/components/LogoutRoute';
import BudgetingPage from '@/features/budget/ManagementPage';
import { CategoriesManagementPage } from '@/features/categories';
import DailyLedgerPage from '@/features/daily-ledger/ListingPage';
import DashboardV1Page from '@/features/dashboard/routes/V1';
import DashboardV2Page from '@/features/dashboard/routes/V2';
import { DebtsManagementPage } from '@/features/debts';
import SandboxPage from '@/features/sandbox/Page';
import { TransactionsListPage } from '@/features/transactions';
import { TransfersListPage } from '@/features/transfers';

const AppShell: React.FC = () => (
  <RequiredDataGate>
    <Layout>
      <Routes>
        <Route index element={<Navigate replace to="/ledger" />} />

        <Route element={<DashboardV1Page />} path="/dashboard/v1" />
        <Route element={<DashboardV2Page />} path="/dashboard/v2" />
        <Route element={<TransactionsListPage />} path="/transactions" />
        <Route element={<TransfersListPage />} path="/transfers" />
        <Route element={<DailyLedgerPage />} path="/ledger" />
        <Route element={<AccountsManagementPage />} path="/accounts/*" />
        <Route element={<DebtsManagementPage />} path="/debts/*" />
        <Route element={<SandboxPage />} path="/testing" />
        <Route element={<BudgetingPage />} path="/budget/*" />
        <Route element={<CategoriesManagementPage />} path="/categories" />

        <Route element={<Navigate replace to="/ledger" />} path="*" />
      </Routes>
    </Layout>
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
