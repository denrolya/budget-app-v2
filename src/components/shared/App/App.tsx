import { Route, Routes, Navigate } from 'react-router-dom';

import PrivateRoute from 'src/components/shared/PrivateRoute/PrivateRoute';
import TransactionList from 'src/components/TransactionList/TransactionList.tsx';
import LoginPage from 'src/containers/LoginPage/LoginPage';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/"
      element={
        <PrivateRoute>
          <h1 className="">Dashboard</h1>
        </PrivateRoute>
      }
    />
    <Route
      path="/transactions"
      element={
        <PrivateRoute>
          <div className="min-h-screen bg-background-light dark:bg-background-dark text-primary-light dark:text-primary-dark">
            <TransactionList />
          </div>
        </PrivateRoute>
      }
      />
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
);

export default App;
