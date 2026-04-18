import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { PageHeader, Card } from '@/components/ui';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  isActive: boolean;
  createdAt: string;
  department: { name: string } | null;
  team: { name: string } | null;
}

interface ProfileChangeRequest {
  id: string;
  requestedName: string | null;
  requestedPosition: string | null;
  requestedPhone: string | null;
  requestedDepartmentName: string | null;
  requestedTeamName: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    position: string | null;
    phone: string | null;
    department: { name: string } | null;
    team: { name: string } | null;
  };
}

const ROLE_LABEL: Record<string, string> = { ADMIN: '메인관리자', SUB_ADMIN: '서브관리자', MEMBER: '멤버' };
const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  SUB_ADMIN: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: '활성', INACTIVE: '비활성', PENDING: '대기' };
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'text-emerald-600 dark:text-emerald-400',
  INACTIVE: 'text-slate-400',
  PENDING: 'text-amber-500',
};

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const isMainAdmin = currentUser?.role === 'ADMIN';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [viewTarget, setViewTarget] = useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [profileRequests, setProfileRequests] = useState<ProfileChangeRequest[]>([]);
  const [profileReqProcessing, setProfileReqProcessing] = useState<string | null>(null);

  const fetchProfileRequests = useCallback(() => {
    api.get('/admin/profile-requests')
      .then(({ data }) => setProfileRequests(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.data))
      .catch(() => toast.error('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
    fetchProfileRequests();
  }, [fetchProfileRequests]);

  const handleProfileRequestAction = async (id: string, action: 'approve' | 'reject') => {
    setProfileReqProcessing(id + action);
    try {
      await api.patch(`/admin/profile-requests/${id}/${action}`);
      toast.success(action === 'approve' ? '프로필 변경이 승인되었습니다.' : '프로필 변경이 거절되었습니다.');
      setProfileRequests(prev => prev.filter(r => r.id !== id));
      if (action === 'approve') {
        // 사용자 목록 갱신
        const { data } = await api.get('/admin/users');
        setUsers(data.data);
      }
    } catch {
      toast.error('처리에 실패했습니다.');
    } finally {
      setProfileReqProcessing(null);
    }
  };

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
      await api.patch(`/admin/users/${deleteTarget.id}/deactivate`);
      toast.success(`${deleteTarget.name}님이 비활성화되었습니다.`);
      setUsers((prev) => prev.map((u) => u.id === deleteTarget.id ? { ...u, isActive: false } : u));
      setDeleteTarget(null);
    } catch {
      toast.error('처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleActivate = async (user: AdminUser) => {
    try {
      await api.patch(`/admin/users/${user.id}/activate`);
      toast.success(`${user.name}님이 활성화되었습니다.`);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: true } : u));
    } catch {
      toast.error('처리에 실패했습니다.');
    }
  };

  const handleRoleChange = async () => {
    if (!roleTarget) return;
    const newRole = roleTarget.role === 'SUB_ADMIN' ? 'MEMBER' : 'SUB_ADMIN';
    setProcessing(true);
    try {
      await api.patch(`/admin/users/${roleTarget.id}/role`, { role: newRole });
      toast.success(
        newRole === 'SUB_ADMIN'
          ? `${roleTarget.name}님을 서브관리자로 임명했습니다.`
          : `${roleTarget.name}님의 서브관리자 권한을 해제했습니다.`
      );
      setUsers((prev) => prev.map((u) => u.id === roleTarget.id ? { ...u, role: newRole } : u));
      setRoleTarget(null);
    } catch {
      toast.error('역할 변경에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Card><div className="flex justify-center py-10"><svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div></Card>;

  return (
    <>
      {/* 프로필 변경 요청 */}
      {profileRequests.length > 0 && (
        <Card className="mb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            프로필 변경 요청
            <span className="text-xs font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">{profileRequests.length}건</span>
          </h2>
          <div className="space-y-3">
            {profileRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-slate-900 dark:text-white">{req.user.name}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{req.user.email}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                      {req.requestedName && (
                        <p><span className="text-slate-400">이름:</span> <span className="line-through text-slate-300 dark:text-slate-600 mr-1">{req.user.name}</span><span className="text-emerald-600 dark:text-emerald-400 font-medium">{req.requestedName}</span></p>
                      )}
                      {req.requestedPosition !== null && (
                        <p><span className="text-slate-400">직책:</span> <span className="line-through text-slate-300 dark:text-slate-600 mr-1">{req.user.position ?? '-'}</span><span className="text-emerald-600 dark:text-emerald-400 font-medium">{req.requestedPosition || '-'}</span></p>
                      )}
                      {req.requestedPhone !== null && (
                        <p><span className="text-slate-400">연락처:</span> <span className="line-through text-slate-300 dark:text-slate-600 mr-1">{req.user.phone ?? '-'}</span><span className="text-emerald-600 dark:text-emerald-400 font-medium">{req.requestedPhone || '-'}</span></p>
                      )}
                      {req.requestedDepartmentName && (
                        <p><span className="text-slate-400">부서:</span> <span className="line-through text-slate-300 dark:text-slate-600 mr-1">{req.user.department?.name ?? '-'}</span><span className="text-emerald-600 dark:text-emerald-400 font-medium">{req.requestedDepartmentName}</span></p>
                      )}
                      {req.requestedTeamName && (
                        <p><span className="text-slate-400">팀:</span> <span className="line-through text-slate-300 dark:text-slate-600 mr-1">{req.user.team?.name ?? '-'}</span><span className="text-emerald-600 dark:text-emerald-400 font-medium">{req.requestedTeamName}</span></p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleProfileRequestAction(req.id, 'approve')}
                      disabled={profileReqProcessing !== null}
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-colors"
                    >
                      {profileReqProcessing === req.id + 'approve' ? '...' : '승인'}
                    </button>
                    <button
                      onClick={() => handleProfileRequestAction(req.id, 'reject')}
                      disabled={profileReqProcessing !== null}
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                    >
                      {profileReqProcessing === req.id + 'reject' ? '...' : '거절'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          사용자 목록
          <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">· {users.length}명</span>
        </h2>
        {users.length === 0 ? (
          <p className="text-center text-slate-400 py-10">등록된 사용자가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {[...users].sort((a, b) => {
              // 활성 > 비활성
              if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
              // 역할 순서: ADMIN > SUB_ADMIN > MEMBER
              const roleOrder: Record<string, number> = { ADMIN: 0, SUB_ADMIN: 1, MEMBER: 2 };
              const ro = (roleOrder[a.role] ?? 2) - (roleOrder[b.role] ?? 2);
              if (ro !== 0) return ro;
              // 같은 역할 내 가입순
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }).map((user) => (
              <div key={user.id} className={clsx(
                'flex items-center justify-between p-4 rounded-xl border gap-3',
                user.isActive
                  ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-700/40 opacity-60'
              )}>
                {/* 프로필 요약 — 클릭 시 상세 모달 */}
                <button
                  onClick={() => setViewTarget(user)}
                  className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('font-medium', user.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500')}>
                      {user.name}
                    </span>
                    {ROLE_BADGE[user.role] && user.isActive && (
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full', ROLE_BADGE[user.role])}>
                        {ROLE_LABEL[user.role]}
                      </span>
                    )}
                    {!user.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        비활성
                      </span>
                    )}
                    {user.isActive && (
                      <span className={clsx('text-xs font-medium', STATUS_COLOR[user.status] ?? 'text-slate-400')}>
                        {STATUS_LABEL[user.status] ?? user.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user.email}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {user.department?.name ?? '-'} · {user.team?.name ?? '-'} · {user.position ?? '-'}
                  </p>
                </button>
                {/* 액션 버튼들 */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {user.isActive ? (
                    <>
                      {/* 서브관리자는 메인관리자 비밀번호 초기화 불가 */}
                      {!(user.role === 'ADMIN' && !isMainAdmin) && (
                        <button
                          onClick={() => { setResetTarget(user); setNewPassword(''); }}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                        >
                          비밀번호 초기화
                        </button>
                      )}
                      {isMainAdmin && user.role !== 'ADMIN' && (
                        <button
                          onClick={() => setRoleTarget(user)}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        >
                          {user.role === 'SUB_ADMIN' ? '서브관리자 해제' : '서브관리자 임명'}
                        </button>
                      )}
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          비활성화
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleActivate(user)}
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      활성화
                    </button>
                  )}
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
                  {ROLE_BADGE[viewTarget.role] && (
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full', ROLE_BADGE[viewTarget.role])}>
                      {ROLE_LABEL[viewTarget.role]}
                    </span>
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
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">사용자 비활성화</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              <strong className="text-slate-900 dark:text-white">{deleteTarget.name}</strong>님을 비활성화 하시겠습니까?<br />
              <span className="text-slate-400 dark:text-slate-500 text-xs mt-1 block">비활성화된 사용자는 로그인이 불가합니다.</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300">취소</button>
              <button onClick={handleDelete} disabled={processing} className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                {processing ? '처리 중...' : '비활성화'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 역할 변경 확인 모달 */}
      {roleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
              {roleTarget.role === 'SUB_ADMIN' ? '서브관리자 해제' : '서브관리자 임명'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              <strong className="text-slate-900 dark:text-white">{roleTarget.name}</strong>님을{' '}
              {roleTarget.role === 'SUB_ADMIN'
                ? '일반 멤버로 변경하시겠습니까?'
                : '서브관리자로 임명하시겠습니까?'}<br />
              <span className="text-slate-400 dark:text-slate-500 text-xs mt-1 block">
                {roleTarget.role === 'SUB_ADMIN'
                  ? '서브관리자 권한이 해제됩니다.'
                  : '서브관리자는 메인관리자를 제외한 모든 사용자를 관리할 수 있습니다.'}
              </span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRoleTarget(null)} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300">취소</button>
              <button onClick={handleRoleChange} disabled={processing} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                {processing ? '처리 중...' : (roleTarget.role === 'SUB_ADMIN' ? '해제' : '임명')}
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
