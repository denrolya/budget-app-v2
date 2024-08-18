import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from 'src/components/shared/Layout/Layout.tsx';
import PrivateRoute from 'src/components/shared/PrivateRoute/PrivateRoute';
import TransactionList from 'src/components/TransactionList/TransactionList.tsx';
import LoginPage from 'src/containers/LoginPage/LoginPage';

const Routing = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<Layout />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={
        <PrivateRoute>
          <div className="min-h-screen bg-background-light dark:bg-background-dark text-primary-light dark:text-primary-dark">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Content Area</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Add your main content here.</p>
          </div>
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
