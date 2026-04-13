import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/utils/api';
import type { User, LoginResponse, ApiResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const autoLogin = localStorage.getItem('wf_auto_login') === 'true';

    // 자동로그인 꺼져 있으면 토큰 제거 후 로그아웃 상태 유지
    if (!autoLogin && !token) {
      setIsLoading(false);
      return;
    }
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get<ApiResponse<User>>('/users/me');
      setUser(data.data);
    } catch {
      // 자동로그인 꺼져 있으면 토큰만 제거
      if (!autoLogin) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } else {
        localStorage.clear();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });

    const { accessToken, refreshToken, user: userData } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.clear();
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
