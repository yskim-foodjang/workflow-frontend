import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/utils/api';
import { getAccessToken, setTokens, clearTokens } from '@/utils/tokenStorage';
import type { User, LoginResponse, ApiResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, persist?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get<ApiResponse<User>>('/users/me');
      setUser(data.data);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string, persist = false) => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    const { accessToken, refreshToken, user: userData } = data.data;
    setTokens(accessToken, refreshToken, persist);
    setUser(userData);
  };

  const logout = async () => {
    try {
      const refreshToken = getAccessToken();
      await api.post('/auth/logout', { refreshToken });
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
