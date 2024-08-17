import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
  children: ReactNode;
}

const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  // Add your JWT validation logic here
  return !!token;
};


const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const location = useLocation();
  return isAuthenticated() ? children : <Navigate to="/login" state={{ from: location }} />;
};

export default PrivateRoute;
