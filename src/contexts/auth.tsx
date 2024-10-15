import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { CURRENCY_CODE } from '@/constants/currency';
import User from '@/models/User';
import { api } from '@/services/api';
import { parseJwt } from '@/utils/parseJWT';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  updateCurrency: (currency: CURRENCY_CODE) => Promise<void>;
  refreshToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const login = (token: string) => {
    const decodedUser = parseJwt(token);
    setToken(token);
    setUser(decodedUser);
    localStorage.setItem('token', token);
    setIsLoading(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateCurrency = async (currency: CURRENCY_CODE) => {
    if (!user) return;

    // Send request to backend to update currency
    await api.put(`/api/users/${user.username}`, {
      baseCurrency: currency,
    });

    // Fetch refreshed token
    await refreshToken();
  };

  const refreshToken = async (): Promise<string> => {
    try {
      const response = await api.get<{ token: string }>('/api/v2/auth/token/refresh');
      const newToken = response.data.token;
      login(newToken);
      return newToken;
    } catch (error) {
      toast.error('Failed to refresh token');
      console.error('Failed to refresh token:', error);
      logout();
      throw new Error('Failed to refresh token');
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      login(storedToken);
    } else {
      setIsLoading(false);
    }
    setIsInitialized(true);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      isLoading,
      isInitialized,
      user,
      token,
      login,
      logout,
      updateCurrency,
      refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useUser = () => {
  const { user } = useAuth();
  if (!user) {
    throw new Error('User is not authenticated');
  }
  return user;
};

export const useBaseCurrency = () => {
  const { baseCurrency } = useUser();
  return baseCurrency;
};
