import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분: 페이지 이동/재방문 시 캐시 데이터 즉시 표시 (깜빡임 없음)
      staleTime: 5 * 60_000,
      // gcTime 기본값 5분 유지 (메모리에서 캐시 유지)
      gcTime: 10 * 60_000,
      // 재시도 1회 (네트워크 일시 오류 대응)
      retry: 1,
      // 창 포커스 시 자동 재요청 비활성화 (불필요한 요청 방지)
      refetchOnWindowFocus: false,
      // 재연결 시 재요청 활성화 (네트워크 복구 후 최신 데이터)
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
