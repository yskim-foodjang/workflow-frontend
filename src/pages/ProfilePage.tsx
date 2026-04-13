import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Avatar, Badge, PageHeader } from '@/components/ui';
import api from '@/utils/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [showPwForm, setShowPwForm] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
