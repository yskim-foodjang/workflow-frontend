import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, Header, BottomTabBar } from '@/components/layout';
import { HomeIcon, CalendarIcon, ListIcon, BellIcon, CogIcon } from '@/components/layout/NavIcons';

const navItems = [
  { to: '/dashboard', label: '대시보드', icon: HomeIcon },
  { to: '/calendar', label: '캘린더', icon: CalendarIcon },
  { to: '/agendas', label: '일정 관리', icon: ListIcon },
  { to: '/notifications', label: '알림', icon: BellIcon },
];

const adminNavItems = [
  { to: '/admin', label: '관리자', icon: CogIcon },
];

export default function Layout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allNav = user?.role === 'ADMIN' ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar navItems={allNav} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 pb-24 lg:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>

      <BottomTabBar navItems={allNav} />
    </div>
  );
}
