import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { PageHeader, Card } from '@/components/ui';

const adminTabs = [
  { to: '/admin', label: '개요', end: true },
  { to: '/admin/users', label: '사용자 관리' },
  { to: '/admin/departments', label: '부서/팀 관리' },
  { to: '/admin/stats', label: '통계' },
];

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="관리자" />
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {adminTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              clsx(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}

export function AdminOverview() {
  return (
    <Card>
      <p className="text-center text-slate-400 dark:text-slate-500 py-10">
        Phase 4에서 관리자 기능이 구현됩니다.
      </p>
    </Card>
  );
}
