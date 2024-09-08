import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '@/app/login/page';
import TransactionsPage from '@/app/transactions/page';
import DebtsPage from '@/app/debts/page';
import Dashboard from '@/components/dashboard-06';
import LayoutV1 from '@/components/shared/Layout/Layout';
import { LayoutV2 } from '@/components/layout-v2';
import { LayoutV3 } from '@/components/layout-v3';
import { LayoutV9 } from '@/components/layout-v9';
import PrivateRoute from '@/components/shared/PrivateRoute/PrivateRoute';

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
              <TransactionsPage />
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
