import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { PageHeader, Card } from '@/components/ui';
import api from '@/utils/api';
import toast from 'react-hot-toast';

const adminTabs = [
  { to: '/admin', label: '개요', end: true },
  { to: '/admin/approvals', label: '승인 관리' },
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
  const location = useLocation();
  if (location.pathname === '/admin/approvals') {
    return <AdminApprovals />;
  }
  return (
    <Card>
      <p className="text-center text-slate-400 dark:text-slate-500 py-10">
        관리자 기능을 선택하세요.
      </p>
    </Card>
  );
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  position: string | null;
  phone: string | null;
  role: string;
  status: string;
  department: { name: string } | null;
  team: { name: string } | null;
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.data))
      .catch(() => toast.error('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const handleReset = async () => {
    if (!resetTarget) return;
    if (newPassword.length < 8) { toast.error('비밀번호는 8자 이상이어야 합니다.'); return; }
    setProcessing(true);
    try {
      await api.patch(`/admin/users/${resetTarget.id}/reset-password`, { password: newPassword });
      toast.success(`${resetTarget.name}님의 비밀번호가 초기화되었습니다.`);
      setResetTarget(null);
      setNewPassword('');
    } catch {
      toast.error('초기화에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Card><div className="flex justify-center py-10"><svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div></Card>;

  return (
    <>
      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">사용자 목록</h2>
        {users.length === 0 ? (
          <p className="text-center text-slate-400 py-10">등록된 사용자가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
                    {user.role === 'ADMIN' && <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">관리자</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {user.department?.name ?? '-'} · {user.team?.name ?? '-'} · {user.position ?? '-'}
                  </p>
                </div>
                <button
                  onClick={() => { setResetTarget(user); setNewPassword(''); }}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex-shrink-0"
                >
                  비밀번호 초기화
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 비밀번호 초기화 모달 */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">비밀번호 초기화</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              <strong>{resetTarget.name}</strong>님의 새 비밀번호를 입력하세요.
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field w-full mb-4"
              placeholder="8자 이상"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setResetTarget(null)} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300">취소</button>
              <button onClick={handleReset} disabled={processing} className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">
                {processing ? '처리 중...' : '초기화'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  position: string | null;
  phone: string | null;
  createdAt: string;
  department: { name: string } | null;
  team: { name: string } | null;
}

export function AdminApprovals() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/admin/pending-users');
      setUsers(data.data);
    } catch {
      toast.error('목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id + action);
    try {
      await api.patch(`/admin/users/${id}/${action}`);
      toast.success(action === 'approve' ? '승인되었습니다.' : '거절되었습니다.');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      toast.error('처리에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center py-10">
          <svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">가입 승인 대기</h2>
      {users.length === 0 ? (
        <p className="text-center text-slate-400 dark:text-slate-500 py-10">
          승인 대기 중인 회원이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
                  {user.position && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{user.position}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {user.department?.name ?? '-'} · {user.team?.name ?? '-'} · {user.phone ?? '-'}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAction(user.id, 'approve')}
                  disabled={processing !== null}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-colors"
                >
                  {processing === user.id + 'approve' ? '...' : '승인'}
                </button>
                <button
                  onClick={() => handleAction(user.id, 'reject')}
                  disabled={processing !== null}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  {processing === user.id + 'reject' ? '...' : '거절'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
