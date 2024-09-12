import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '@/app/login/page';
import TransactionsListPage from '@/app/transactions/page';
import DailyLedgerPage from '@/app/daily-ledger/page';
import DebtsPage from '@/app/debts/page';
import { Dashboard } from '@/components/features/dashboard/Dashboard';
import { LayoutV9 } from '@/components/layout/LayoutV9';
import { PrivateRoute } from '@/components/common/PrivateRoute';

const Routing = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<LayoutV9 />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route
        path="transactions"
        element={
          <PrivateRoute>
              <TransactionsListPage />
          </PrivateRoute>
        } />
      <Route
        path="ledger"
        element={
          <PrivateRoute>
            <DailyLedgerPage />
          </PrivateRoute>
        } />
      <Route
        path="debts"
        element={
          <PrivateRoute>
            <DebtsPage />
          </PrivateRoute>
        } />
    </Route>
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
);

export default Routing;
