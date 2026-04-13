import { useAuth } from '@/contexts/AuthContext';
import { Card, Avatar, Badge, PageHeader } from '@/components/ui';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="내 프로필" />

      <Card>
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
            <dt className="text-sm text-slate-500 dark:text-slate-400">부서</dt>
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
    </div>
  );
}
