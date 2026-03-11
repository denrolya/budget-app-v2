import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import RequireAuth from '@/components/common/RequireAuth';
import RequiredDataGate from '@/components/common/RequiredDataGate';
import Layout from '@/components/layout/Layout';
import { LoginPage, LogoutRoute } from '@/features/auth';

const AccountsManagementPage = lazy(() =>
  import('@/features/accounts').then(({ AccountsManagementPage: C }) => ({ default: C })),
);
const BudgetingPage = lazy(() => import('@/features/budget').then(({ BudgetingPage: C }) => ({ default: C })));
const CategoriesManagementPage = lazy(() =>
  import('@/features/categories').then(({ CategoriesManagementPage: C }) => ({ default: C })),
);
const DailyLedgerPage = lazy(() =>
  import('@/features/daily-ledger').then(({ DailyLedgerPage: C }) => ({ default: C })),
);
const DashboardPage = lazy(() => import('@/features/dashboard').then(({ DashboardPage: C }) => ({ default: C })));
const DebtsManagementPage = lazy(() =>
  import('@/features/debts').then(({ DebtsManagementPage: C }) => ({ default: C })),
);
const BucketsPage = lazy(() => import('@/features/buckets').then(({ BucketsPage: C }) => ({ default: C })));
const SandboxPage = lazy(() => import('@/features/sandbox').then(({ SandboxPage: C }) => ({ default: C })));
const TransactionsListPage = lazy(() =>
  import('@/features/transactions').then(({ TransactionsListPage: C }) => ({ default: C })),
);
const TransfersListPage = lazy(() =>
  import('@/features/transfers').then(({ TransfersListPage: C }) => ({ default: C })),
);

const AppShell: React.FC = () => (
  <RequiredDataGate>
    <Layout>
      <Suspense fallback={null}>
        <Routes>
          <Route index element={<Navigate replace to="/ledger" />} />

          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<TransactionsListPage />} path="/transactions" />
          <Route element={<TransfersListPage />} path="/transfers" />
          <Route element={<DailyLedgerPage />} path="/ledger" />
          <Route element={<AccountsManagementPage />} path="/accounts/*" />
          <Route element={<DebtsManagementPage />} path="/debts/*" />
          <Route element={<BucketsPage />} path="/buckets" />
          <Route element={<SandboxPage />} path="/sandbox" />
          <Route element={<BudgetingPage />} path="/budget/*" />
          <Route element={<CategoriesManagementPage />} path="/categories" />

          <Route element={<Navigate replace to="/ledger" />} path="*" />
        </Routes>
      </Suspense>
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
