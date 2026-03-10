import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const AccountsIndexPage = lazy(() => import('./AccountsIndexPage'));
const AccountDetailPage = lazy(() => import('./AccountDetailPage'));

// ─── Page shell (lazy-loaded route split) ─────────────────────────────────────

const ManagementPage: React.FC = () => (
  <div className="h-full min-h-0 flex flex-col overflow-hidden">
    <Routes>
      <Route index element={<Suspense fallback={null}><AccountsIndexPage /></Suspense>} />
      <Route element={<Suspense fallback={null}><AccountDetailPage /></Suspense>} path=":accountId" />
      <Route element={<Navigate replace to="/accounts" />} path="*" />
    </Routes>
  </div>
);

export default ManagementPage;
