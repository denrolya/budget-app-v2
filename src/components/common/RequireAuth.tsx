import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth';

const RequireAuth: React.FC = () => {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const location = useLocation();

  if (!isInitialized || isLoading) return <div className="fixed inset-0 bg-background" />;

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
};

export default RequireAuth;
