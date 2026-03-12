import moment from 'moment';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { api } from '@/services/api';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useAuth } from '../contexts/auth';
import { type Credentials } from '../types';

export const LoginPage = () => {
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated && user?.exp) {
      const isExpired = moment.unix(user.exp).isBefore(moment());

      if (isExpired) {
        toast.warning('Session expired. Please log in again.');
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleLogin = async (values: Credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/login_check', values);
      const { token } = response.data;
      login(token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm error={error} isLoading={isLoading} onSubmit={handleLogin} />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
