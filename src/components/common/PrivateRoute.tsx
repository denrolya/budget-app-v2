import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/auth';

export const PrivateRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} />;
};

export default PrivateRoute;
