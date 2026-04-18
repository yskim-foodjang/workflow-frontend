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

const ROLE_LABEL: Record<string, string> = { ADMIN: '관리자', USER: '일반' };
const STATUS_LABEL: Record<string, string> = { ACTIVE: '활성', INACTIVE: '비활성', PENDING: '대기' };
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'text-emerald-600 dark:text-emerald-400',
  INACTIVE: 'text-slate-400',
  PENDING: 'text-amber-500',
};

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [viewTarget, setViewTarget] = useState<AdminUser | null>(null);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setProcessing(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast.success(`${deleteTarget.name}님이 삭제되었습니다.`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error('삭제에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Card><div className="flex justify-center py-10"><svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div></Card>;

  return (
    <>
      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          사용자 목록
          <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">· {users.length}명</span>
        </h2>
        {users.length === 0 ? (
          <p className="text-center text-slate-400 py-10">등록된 사용자가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 gap-3">
                {/* 프로필 요약 — 클릭 시 상세 모달 */}
                <button
                  onClick={() => setViewTarget(user)}
                  className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
                    {user.role === 'ADMIN' && (
                      <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">관리자</span>
                    )}
                    <span className={clsx('text-xs font-medium', STATUS_COLOR[user.status] ?? 'text-slate-400')}>
                      {STATUS_LABEL[user.status] ?? user.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user.email}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {user.department?.name ?? '-'} · {user.team?.name ?? '-'} · {user.position ?? '-'}
                  </p>
                </button>
                {/* 액션 버튼들 */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setResetTarget(user); setNewPassword(''); }}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    비밀번호 초기화
                  </button>
                  <button
                    onClick={() => setDeleteTarget(user)}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 프로필 상세 모달 */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">프로필 상세</h3>
              <button onClick={() => setViewTarget(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* 아바타 */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 text-lg font-bold flex-shrink-0">
                {viewTarget.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{viewTarget.name}</span>
                  {viewTarget.role === 'ADMIN' && (
                    <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">관리자</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{viewTarget.email}</p>
              </div>
            </div>
            <dl className="space-y-2.5 text-sm">
              {[
                { label: '부서', value: viewTarget.department?.name ?? '-' },
                { label: '팀', value: viewTarget.team?.name ?? '-' },
                { label: '직책', value: viewTarget.position ?? '-' },
                { label: '연락처', value: viewTarget.phone ?? '-' },
                { label: '권한', value: ROLE_LABEL[viewTarget.role] ?? viewTarget.role },
                { label: '상태', value: STATUS_LABEL[viewTarget.status] ?? viewTarget.status, colorClass: STATUS_COLOR[viewTarget.status] },
              ].map(({ label, value, colorClass }) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</dt>
                  <dd className={clsx('font-medium text-right', colorClass ?? 'text-slate-900 dark:text-white')}>{value}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => setViewTarget(null)}
              className="mt-5 w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

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

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">사용자 삭제</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              <strong className="text-slate-900 dark:text-white">{deleteTarget.name}</strong>님을 삭제하시겠습니까?<br />
              <span className="text-rose-500 dark:text-rose-400 text-xs mt-1 block">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300">취소</button>
              <button onClick={handleDelete} disabled={processing} className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                {processing ? '처리 중...' : '삭제'}
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
