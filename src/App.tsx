import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';
import Layout from '@/components/AppLayout';
import type { ReactNode } from 'react';

// ─── 코드 스플리팅: 각 페이지를 별도 번들로 분리 ────────────────────────────
// 로그인/인증 페이지 (경량, 즉시 필요)
import LoginPage from '@/pages/LoginPage';
import InstallPage from '@/pages/InstallPage';

// 나머지는 방문 시 lazy load → 초기 번들 크기 대폭 감소
const DashboardPage    = lazy(() => import('@/pages/DashboardPage'));
const CalendarPage     = lazy(() => import('@/pages/CalendarPage'));
const AgendasPage      = lazy(() => import('@/pages/AgendasPage'));
const AgendaFormPage   = lazy(() => import('@/pages/AgendaFormPage'));
const AgendaDetailPage = lazy(() => import('@/pages/AgendaDetailPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const ProfilePage      = lazy(() => import('@/pages/ProfilePage'));
const AdminPage        = lazy(() => import('@/pages/AdminPage'));
const RegisterPage     = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('@/pages/ResetPasswordPage'));

// Admin 서브 컴포넌트 (AdminPage 내에서 named export)
const AdminOverview     = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminOverview })));
const AdminApprovals    = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminApprovals })));
const AdminUsers        = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminUsers })));
const AdminServerStats  = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminServerStats })));

// ─── 페이지 로딩 폴백 ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <svg className="animate-spin w-7 h-7 text-primary-600" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

// ─── 인증 가드 ────────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-primary-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500 dark:text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN' && user?.role !== 'SUB_ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── 라우트 ──────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <svg className="animate-spin w-8 h-8 text-primary-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/install" element={<InstallPage />} />
        <Route path="/register"        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/login"           element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/calendar"         element={<CalendarPage />} />
          <Route path="/agendas"          element={<AgendasPage />} />
          <Route path="/agendas/new"      element={<AgendaFormPage />} />
          <Route path="/agendas/:id"      element={<AgendaDetailPage />} />
          <Route path="/agendas/:id/edit" element={<AgendaFormPage />} />
          <Route path="/notifications"    element={<NotificationsPage />} />
          <Route path="/profile"          element={<ProfilePage />} />

          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>}>
            <Route index              element={<AdminOverview />} />
            <Route path="approvals"   element={<AdminApprovals />} />
            <Route path="users"       element={<AdminUsers />} />
            <Route path="departments" element={<AdminOverview />} />
            <Route path="stats"       element={<AdminOverview />} />
            <Route path="server"      element={<AdminServerStats />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

// ─── 앱 루트 ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '10px',
                  background: '#1e293b',
                  color: '#f1f5f9',
                  fontSize: '14px',
                },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
