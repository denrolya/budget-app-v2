import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  username: string;
  roles: string[];
  exp: number;
  iat: number;
  baseCurrency: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // On login, parse the JWT, store in state and sessionStorage
  const login = (token: string) => {
    const decodedUser = parseJwt(token); // Implement parseJwt to decode token and extract user data
    setToken(token);
    setUser(decodedUser);
    sessionStorage.setItem('token', token);
    setIsLoading(false);
  };

  // On logout, clear the state and sessionStorage
  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('token');
  };

  // Initialize state from sessionStorage on app load
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
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, isInitialized, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Utility function to decode JWT and extract user data
const parseJwt = (token: string): User => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
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
  return user;
};

export const useBaseCurrency = () => {
  const { user: { baseCurrency } } = useAuth();
  return baseCurrency;
};
