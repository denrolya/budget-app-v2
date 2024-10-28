import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/auth';

export const PrivateRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} />;
};

export default PrivateRoute;
