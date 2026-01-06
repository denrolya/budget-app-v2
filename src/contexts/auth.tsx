import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { CURRENCY_CODE } from '@/constants/currency';
import User from '@/models/User';
import { api } from '@/services/api';
import storage from '@/services/storage';
import { parseJwt } from '@/lib/parseJWT';

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

const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;

  try {
    const payload = parseJwt(token);

    // Check if all required fields are present
    if (!payload.exp || !payload.roles || !payload.username || !payload.baseCurrency) {
      return false;
    }

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const login = useCallback((token: string) => {
    if (isTokenValid(token)) {
      const decodedUser = parseJwt(token);
      setToken(token);
      setUser(decodedUser);
      storage.setItem('token', token);
      setIsLoading(false);
    } else {
      console.error('Invalid token provided');
      toast.error('Invalid authentication token');
      logout();
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    storage.removeItem('token');
  }, []);

  const updateCurrency = async (currency: CURRENCY_CODE) => {
    if (!user) return;

    // Send request to backend to update currency
    await api.put(`/api/users/${user.username}`, {
      baseCurrency: currency,
    });

    // Fetch refreshed token
    await refreshToken();
  };

  const refreshToken = useCallback(async (): Promise<string> => {
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
  }, [login, logout]);

  useEffect(() => {
    const storedToken = storage.getItem('token') as string | null;
    if (storedToken && isTokenValid(storedToken)) {
      login(storedToken);
    } else {
      setIsLoading(false);
      if (storedToken) {
        storage.removeItem('token');
      }
    }
    setIsInitialized(true);
  }, [login]);

  return (
    <AuthContext.Provider
      value={{
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
