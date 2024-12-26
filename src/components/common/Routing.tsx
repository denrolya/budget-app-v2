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
import PrivateRoute from '@/components/common/PrivateRoute';
import NewTransactionsPage from '@/components/features/transactions/TableWithFiltersMock';
import LayoutV9 from '@/components/layout/LayoutV9';
import { useAuth } from '@/contexts/auth';
import FinanceDataProvider, { useFinanceData } from '@/contexts/FinanceData';

const ProtectedContent: React.FC = () => {
  const { data, error } = useFinanceData();

  if (error || !data) {
    return <Navigate to="/login" replace />;
  }

  return (
    <LayoutV9>
      <Routes>
        <Route index element={<Navigate to="/ledger" replace />} />
        <Route path="dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="transactions" element={<PrivateRoute><TransactionsListPage /></PrivateRoute>} />
        <Route path="transactions-new" element={<PrivateRoute><NewTransactionsPage /></PrivateRoute>} />
        <Route path="transfers" element={<PrivateRoute><TransfersListPage /></PrivateRoute>} />
        <Route path="ledger" element={<PrivateRoute><DailyLedgerPage /></PrivateRoute>} />
        <Route path="accounts" element={<PrivateRoute><AccountsManagementPage /></PrivateRoute>} />
        <Route path="debts" element={<PrivateRoute><DebtsPage /></PrivateRoute>} />
        <Route path="testing" element={<PrivateRoute><TestingPage /></PrivateRoute>} />
        <Route path="budget" element={<PrivateRoute><BudgetingPage /></PrivateRoute>} />
        <Route path="categories" element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/ledger" />} />
      </Routes>
    </LayoutV9>
  );
};

const Routing: React.FC = () => {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();

  if (!isInitialized || isLoading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {isAuthenticated ? (
        <Route
          path="/*"
          element={
            <FinanceDataProvider>
              <ProtectedContent />
            </FinanceDataProvider>
          }
        />
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default Routing;
