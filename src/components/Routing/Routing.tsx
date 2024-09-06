import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from '@/components/shared/Layout/Layout.tsx';
import PrivateRoute from '@/components/shared/PrivateRoute/PrivateRoute';
import TransactionList from '@/components/TransactionList/TransactionList';
import LoginPage from '@/app/login/page';
import Dashboard from '@/components/dashboard-06'

const Routing = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<Layout />}>
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
            <div className="min-h-screen bg-background-light dark:bg-background-dark text-primary-light dark:text-primary-dark">
              <TransactionList />
            </div>
          </PrivateRoute>
        } />
    </Route>
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
);

export default Routing;
