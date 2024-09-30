import React, { createContext, useContext, useState, useEffect } from 'react';

import { CURRENCY_CODE } from '@/constants/currency';
import { parseJwt } from '@/utils/parseJWT';
import User from '@/models/User';
import { api } from '@/services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  updateCurrency: (currency: CURRENCY_CODE) => Promise<void>;
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
    sessionStorage.setItem('token', token);
    setIsLoading(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('token');
  };

  const updateCurrency = async (currency: CURRENCY_CODE) => {
    if (!user) return;

    // Send request to backend to update currency
    await api.put(`/api/users/${user.username}`, {
      baseCurrency: currency,
    });

    // Update user state
    setUser({ ...user, baseCurrency: currency });

    // TODO: Fetch refreshed token here
  };

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (storedToken) {
      login(storedToken);
    } else {
      setIsLoading(false);
    }
    setIsInitialized(true);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, isInitialized, user, token, login, logout, updateCurrency }}>
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
