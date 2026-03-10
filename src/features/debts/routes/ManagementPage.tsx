import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const DebtsIndexPage = lazy(() => import('./DebtsIndexPage'));
const DebtDetailPage = lazy(() => import('./DebtDetailPage'));

const ManagementPage: React.FC = () => (
  <div className="h-full min-h-0 flex flex-col overflow-hidden">
    <Routes>
      <Route index element={<Suspense fallback={null}><DebtsIndexPage /></Suspense>} />
      <Route element={<Suspense fallback={null}><DebtDetailPage /></Suspense>} path=":debtId" />
      <Route element={<Navigate replace to="/debts" />} path="*" />
    </Routes>
  </div>
);

export default ManagementPage;
