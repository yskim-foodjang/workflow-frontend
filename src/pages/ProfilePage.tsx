import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Avatar, Badge, PageHeader } from '@/components/ui';
import api from '@/utils/api';
import toast from 'react-hot-toast';

interface ProfileRequest {
  id: string;
  requestedName: string | null;
  requestedPosition: string | null;
  requestedPhone: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [showPwForm, setShowPwForm] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 프로필 수정 요청
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', position: '', phone: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<ProfileRequest | null>(null);
  const [requestLoading, setRequestLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/profile-request')
      .then(({ data }) => setPendingRequest(data.data))
      .catch(() => {})
      .finally(() => setRequestLoading(false));
  }, []);

  const handleEditSubmit = async () => {
    const payload: Record<string, string> = {};
    if (editForm.name.trim()) payload.name = editForm.name.trim();
    if (editForm.position.trim() !== '') payload.position = editForm.position.trim();
    if (editForm.phone.trim() !== '') payload.phone = editForm.phone.trim();

    if (Object.keys(payload).length === 0) {
      toast.error('최소 하나의 항목을 입력해주세요.'); return;
    }

    setEditSubmitting(true);
    try {
      const { data } = await api.post('/users/me/profile-request', payload);
      setPendingRequest(data.data);
      setShowEditForm(false);
      setEditForm({ name: '', position: '', phone: '' });
      toast.success('수정 요청이 제출되었습니다. 관리자 승인 후 반영됩니다.');
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'REQUEST_EXISTS') {
        toast.error('이미 대기 중인 수정 요청이 있습니다.');
      } else {
        toast.error('요청 제출에 실패했습니다.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!form.current || !form.next || !form.confirm) {
      toast.error('모든 항목을 입력해주세요.'); return;
    }
    if (form.next !== form.confirm) {
      toast.error('새 비밀번호가 일치하지 않습니다.'); return;
    }
    if (form.next.length < 8) {
      toast.error('새 비밀번호는 8자 이상이어야 합니다.'); return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.current,
        newPassword: form.next,
      });
      toast.success('비밀번호가 변경되었습니다.');
      setForm({ current: '', next: '', confirm: '' });
      setShowPwForm(false);
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'WRONG_PASSWORD') {
        toast.error('현재 비밀번호가 올바르지 않습니다.');
      } else {
        toast.error('비밀번호 변경에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="내 프로필" />

      <Card className="mb-4">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={user?.name || ''} size="lg" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{user?.name}</h2>
            <p className="text-slate-500 dark:text-slate-400">{user?.position}</p>
          </div>
        </div>
        <dl className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <dt className="text-sm text-slate-500 dark:text-slate-400">이메일</dt>
            <dd className="text-sm text-slate-900 dark:text-white">{user?.email}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <dt className="text-sm text-slate-500 dark:text-slate-400">부서(공장)</dt>
            <dd className="text-sm text-slate-900 dark:text-white">{user?.department?.name || '-'}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <dt className="text-sm text-slate-500 dark:text-slate-400">팀</dt>
            <dd className="text-sm text-slate-900 dark:text-white">{user?.team?.name || '-'}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-sm text-slate-500 dark:text-slate-400">권한</dt>
            <dd>
              <Badge variant={user?.role === 'ADMIN' ? 'warning' : 'default'}>
                {user?.role === 'ADMIN' ? '관리자' : '멤버'}
              </Badge>
            </dd>
          </div>
        </dl>
      </Card>

      {/* 프로필 수정 요청 */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">프로필 수정</h3>
          {!requestLoading && pendingRequest?.status !== 'PENDING' && (
            <button
              onClick={() => {
                setShowEditForm(!showEditForm);
                setEditForm({ name: '', position: '', phone: '' });
              }}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              {showEditForm ? '취소' : '수정 요청'}
            </button>
          )}
        </div>

        {/* 대기 중인 요청 상태 */}
        {!requestLoading && pendingRequest && (
          <div className={`mb-4 p-3 rounded-xl text-sm border ${
            pendingRequest.status === 'PENDING'
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300'
              : pendingRequest.status === 'APPROVED'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300'
          }`}>
            <p className="font-medium mb-1">
              {pendingRequest.status === 'PENDING' ? '⏳ 승인 대기 중' : pendingRequest.status === 'APPROVED' ? '✅ 승인됨' : '❌ 거절됨'}
            </p>
            <div className="space-y-0.5 text-xs opacity-80">
              {pendingRequest.requestedName && <p>이름: {pendingRequest.requestedName}</p>}
              {pendingRequest.requestedPosition !== null && <p>직책: {pendingRequest.requestedPosition || '(삭제)'}</p>}
              {pendingRequest.requestedPhone !== null && <p>연락처: {pendingRequest.requestedPhone || '(삭제)'}</p>}
            </div>
            {pendingRequest.adminNote && (
              <p className="mt-1.5 text-xs opacity-70">관리자 메모: {pendingRequest.adminNote}</p>
            )}
          </div>
        )}

        {showEditForm ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                이름 <span className="text-xs font-normal text-slate-400">(현재: {user?.name})</span>
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="input-field"
                placeholder="변경할 이름 (비워두면 유지)"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                직책 <span className="text-xs font-normal text-slate-400">(현재: {user?.position || '-'})</span>
              </label>
              <input
                type="text"
                value={editForm.position}
                onChange={(e) => setEditForm((f) => ({ ...f, position: e.target.value }))}
                className="input-field"
                placeholder="변경할 직책 (비워두면 유지)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                연락처 <span className="text-xs font-normal text-slate-400">(현재: {(user as any)?.phone || '-'})</span>
              </label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                className="input-field"
                placeholder="변경할 연락처 (비워두면 유지)"
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              * 수정 요청은 관리자 승인 후 반영됩니다.
            </p>
            <button
              onClick={handleEditSubmit}
              disabled={editSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {editSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  제출 중...
                </>
              ) : '수정 요청 제출'}
            </button>
          </div>
        ) : (
          !requestLoading && !pendingRequest && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              이름, 직책, 연락처 변경을 요청할 수 있습니다. 관리자 승인 후 반영됩니다.
            </p>
          )
        )}
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">비밀번호 변경</h3>
          <button
            onClick={() => { setShowPwForm(!showPwForm); setForm({ current: '', next: '', confirm: '' }); }}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            {showPwForm ? '취소' : '변경하기'}
          </button>
        </div>

        {showPwForm ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">현재 비밀번호</label>
              <input
                type="password"
                value={form.current}
                onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
                className="input-field"
                placeholder="현재 비밀번호 입력"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">새 비밀번호</label>
              <input
                type="password"
                value={form.next}
                onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
                className="input-field"
                placeholder="8자 이상"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">새 비밀번호 확인</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                className="input-field"
                placeholder="새 비밀번호 재입력"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  변경 중...
                </>
              ) : '비밀번호 변경'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            보안을 위해 주기적으로 비밀번호를 변경해주세요.
          </p>
        )}
      </Card>
    </div>
  );
}
