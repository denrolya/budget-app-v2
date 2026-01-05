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
import NewTransactionsPage from '@/components/features/transactions/TableWithFiltersMock';
import LayoutV9 from '@/components/layout/LayoutV9';
import FinanceDataProvider from '@/contexts/FinanceData';
import RequireAuth from '@/components/common/RequireAuth';

const AppShell: React.FC = () => (
    <FinanceDataProvider>
      <LayoutV9>
        <Routes>
          <Route index element={<Navigate to="/ledger" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsListPage />} />
          <Route path="/transactions-new" element={<NewTransactionsPage />} />
          <Route path="/transfers" element={<TransfersListPage />} />
          <Route path="/ledger" element={<DailyLedgerPage />} />
          <Route path="/accounts/*" element={<AccountsManagementPage />} />
          <Route path="/debts" element={<DebtsPage />} />
          <Route path="/testing" element={<TestingPage />} />
          <Route path="/budget" element={<BudgetingPage />} />
          <Route path="/categories" element={<CategoriesPage />} />

          <Route path="*" element={<Navigate to="/ledger" replace />} />
        </Routes>
      </LayoutV9>
    </FinanceDataProvider>
  );

const Routing: React.FC = () => (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Auth-protected app */}
      <Route element={<RequireAuth />}>
        <Route path="/*" element={<AppShell />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/ledger" replace />} />
    </Routes>
  );

export default Routing;
