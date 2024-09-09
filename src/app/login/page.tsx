import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { LoginForm } from '@/components/login-form';

const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  // Add your JWT validation logic here
  return !!token;
};

export default function Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from);
    }
  }, [navigate, from]);

  const handleLogin = () => {
    const token = 'dummy-jwt-token';
    localStorage.setItem('token', token);
    navigate(from);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}
