import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/auth';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';

export interface Credentials {
  username: string;
  password: string;
}

export const Page = () => {
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
        navigate(from);
      }
    }
  }, [navigate, from]);

  const handleLogin = async (values: Credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/login_check', values);
      const { token } = response.data;
      login(token);
      navigate(from);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
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

export default Page;
