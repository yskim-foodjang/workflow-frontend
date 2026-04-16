import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 페이지 이동 후 재포커스 시 재요청 간격: 30초
      staleTime: 30_000,
      // 네트워크 에러 시 재시도 1회
      retry: 1,
      // 창 포커스 시 자동 재요청 (깜빡임 방지를 위해 staleTime 이후에만)
      refetchOnWindowFocus: false,
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
