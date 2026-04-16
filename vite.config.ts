import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 벤더 라이브러리를 별도 청크로 분리 → 브라우저 캐시 활용
        manualChunks: {
          // React 코어 (거의 변경 안 됨 → 장기 캐시)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // TanStack Query
          'vendor-query': ['@tanstack/react-query'],
          // FullCalendar (무거운 라이브러리)
          'vendor-calendar': [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/list',
            '@fullcalendar/interaction',
          ],
          // 유틸리티
          'vendor-utils': ['date-fns', 'clsx', 'axios', 'react-hot-toast'],
        },
      },
    },
    // 청크 경고 임계치 상향 (FullCalendar 특성상 불가피)
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
});
