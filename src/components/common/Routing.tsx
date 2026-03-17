import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import RequireAuth from '@/components/common/RequireAuth';
import RequiredDataGate from '@/components/common/RequiredDataGate';
import Layout from '@/components/layout/LayoutTerminal'; // TUI layout — revert: change to '@/components/layout/Layout'
import { LoginPage, LogoutRoute } from '@/features/auth';
import MobileShell from '@/features/mobile/layout/MobileShell';
import { useIsMobile } from '@/hooks/use-mobile';

const AccountsManagementPage = lazy(() => import('@/features/accounts/routes/ManagementPage'));
const BudgetingPage = lazy(() => import('@/features/budget').then(({ BudgetingPage: C }) => ({ default: C })));
const CategoriesManagementPage = lazy(() =>
  import('@/features/categories').then(({ CategoriesManagementPage: C }) => ({ default: C })),
);
const LedgerPage = lazy(() => import('@/features/ledger').then(({ LedgerPage: C }) => ({ default: C })));
const DashboardPage = lazy(() => import('@/features/dashboard').then(({ DashboardPage: C }) => ({ default: C })));
const DebtsManagementPage = lazy(() =>
  import('@/features/debts').then(({ DebtsManagementPage: C }) => ({ default: C })),
);
const BucketsPage = lazy(() => import('@/features/buckets').then(({ BucketsPage: C }) => ({ default: C })));

const MobileBalancesPage = lazy(() => import('@/features/mobile/routes/MobileBalancesPage'));
const MobileLedgerPage = lazy(() => import('@/features/mobile/routes/MobileLedgerPage'));
const MobileRatesPage = lazy(() => import('@/features/mobile/routes/MobileRatesPage'));
const MobileConverterPage = lazy(() => import('@/features/mobile/routes/MobileConverterPage'));
const MobileBudgetPage = lazy(() => import('@/features/mobile/routes/MobileBudgetPage'));

const MobileApp: React.FC = () => (
  <RequiredDataGate>
    <Suspense fallback={null}>
      <Routes>
        <Route element={<MobileShell />}>
          <Route index element={<Navigate replace to="/m/balances" />} />
          <Route element={<MobileBalancesPage />} path="balances" />
          <Route element={<MobileLedgerPage />} path="ledger" />
          <Route element={<MobileRatesPage />} path="rates" />
          <Route element={<MobileConverterPage />} path="convert" />
          <Route element={<MobileBudgetPage />} path="budget" />
          <Route element={<Navigate replace to="/m/balances" />} path="*" />
        </Route>
      </Routes>
    </Suspense>
  </RequiredDataGate>
);

const AppShell: React.FC = () => (
  <RequiredDataGate>
    <Layout>
      <Suspense fallback={null}>
        <Routes>
          <Route index element={<Navigate replace to="/ledger" />} />

          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<LedgerPage />} path="/ledger" />
          <Route element={<AccountsManagementPage />} path="/accounts/*" />
          <Route element={<DebtsManagementPage />} path="/debts/*" />
          <Route element={<BucketsPage />} path="/buckets" />

          <Route element={<BudgetingPage />} path="/budget/*" />
          <Route element={<CategoriesManagementPage />} path="/categories" />

          <Route element={<Navigate replace to="/ledger" />} path="*" />
        </Routes>
      </Suspense>
    </Layout>
  </RequiredDataGate>
);

// Redirect mobile browsers to the mobile shell automatically.
const DesktopShell: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <Navigate replace to="/m/balances" />;
  return <AppShell />;
};

const Routing: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route element={<LoginPage />} path="/login" />
    <Route element={<LogoutRoute />} path="/logout" />

    {/* Protected */}
    <Route element={<RequireAuth />}>
      <Route element={<MobileApp />} path="/m/*" />
      <Route element={<DesktopShell />} path="/*" />
    </Route>

    {/* Fallback */}
    <Route element={<Navigate replace to="/ledger" />} path="*" />
  </Routes>
);

export default Routing;
