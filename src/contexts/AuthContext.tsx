import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/utils/api';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenPersisted } from '@/utils/tokenStorage';
import type { User, LoginResponse, ApiResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, persist?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
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
    } catch (err: any) {
      // 401만 토큰 삭제 — 네트워크 에러/서버 점검 등에는 토큰 유지
      if (err.response?.status === 401) {
        clearTokens();
      }
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

  // 토큰 재발급 + 유저 상태 최신화 (역할·프로필 변경 후 호출)
  const refreshSession = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return;
    try {
      const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefresh, user: userData } = data.data;
      setTokens(accessToken, newRefresh, isTokenPersisted());
      setUser(userData);
    } catch {
      // refresh 실패 시 그냥 fetchUser로 fallback
      await fetchUser();
    }
  }, [fetchUser]);

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      await api.post('/auth/logout', { refreshToken });
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshSession }}>
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
