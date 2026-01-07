import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/auth';

const LogoutRoute: React.FC = () => {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return <Navigate replace to="/login" />;
};

export default LogoutRoute;
