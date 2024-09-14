import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AccountsManagementPage } from '@/app/accounts/page';
import LoginPage from '@/app/login/page';
import TransactionsListPage from '@/app/transactions/page';
import DailyLedgerPage from '@/app/daily-ledger/page';
import DebtsPage from '@/app/debts/page';
import { Dashboard } from '@/components/features/dashboard/Dashboard';
import { LayoutV9 } from '@/components/layout/LayoutV9';
import { PrivateRoute } from '@/components/common/PrivateRoute';
import { FinanceDataProvider, useFinanceData } from '@/contexts/FinanceData';
import { useAuth } from '@/contexts/auth';

const ProtectedContent: React.FC = () => {
  const { data, isLoading, error } = useFinanceData();

  if (isLoading) {
    return <div>Loading financial data...</div>;
  }

  if (error || !data) {
    return <Navigate to="/login" replace />;
  }

  return (
    <LayoutV9>
      <Routes>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="transactions" element={
          <PrivateRoute>
            <TransactionsListPage />
          </PrivateRoute>
        } />
        <Route path="ledger" element={
          <PrivateRoute>
            <DailyLedgerPage />
          </PrivateRoute>
        } />
        <Route path="accounts" element={
          <PrivateRoute>
            <AccountsManagementPage />
          </PrivateRoute>
        } />
        <Route path="debts" element={
          <PrivateRoute>
            <DebtsPage />
          </PrivateRoute>
        } />
      </Routes>
    </LayoutV9>
  );
};

const Routing: React.FC = () => {
  const { isInitialized, isAuthenticated } = useAuth();

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {isAuthenticated ? (
        <Route path="/*" element={
          <FinanceDataProvider>
            <ProtectedContent />
          </FinanceDataProvider>
        } />
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default Routing;
