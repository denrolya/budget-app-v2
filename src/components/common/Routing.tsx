import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AccountsManagementPage from '@/app/accounts/page';
import BudgetingPage from '@/app/budget/page';
import CategoriesPage from '@/app/categories/page';
import DailyLedgerPage from '@/app/daily-ledger/page';
import DashboardPage from '@/app/dashboard/page';
import DebtsPage from '@/app/debts/page';
import LoginPage from '@/app/login/page';
import TestingPage from '@/app/testing-page/page';
import TransactionsListPage from '@/app/transactions/page';
import TransfersListPage from '@/app/transfers/page';
import LayoutV9 from '@/components/layout/LayoutV9';
import FinanceDataProvider from '@/contexts/FinanceData';
import RequireAuth from '@/components/common/RequireAuth';

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
          <Route element={<DebtsPage />} path="/debts" />
          <Route element={<TestingPage />} path="/testing" />
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
