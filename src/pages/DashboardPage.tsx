import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgendas } from '@/hooks/useAgendas';
import { useNotifications } from '@/hooks/useNotifications';
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_BG, PRIORITY_LABELS, PRIORITY_COLORS } from '@/utils/constants';
import { format, isToday, isThisWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, Badge, PageHeader, Skeleton } from '@/components/ui';

function StatCard({ title, value, isLoading }: { title: string; value: number | string; isLoading: boolean }) {
  return (
    <Card>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-16" variant="rectangular" />
      ) : (
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { agendas, isLoading: agendasLoading } = useAgendas({});
  const { notifications, unreadCount, isLoading: notiLoading } = useNotifications();

  const todayAgendas = agendas.filter((a) => isToday(new Date(a.startAt)));
  const weekDeadlines = agendas.filter((a) => a.deadline && isThisWeek(new Date(a.deadline), { weekStartsOn: 1 }));
  const incomplete = agendas.filter((a) => !a.isCompleted);
  const isLoading = agendasLoading || notiLoading;

  return (
    <div>
      <PageHeader title={`안녕하세요, ${user?.name}님`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="오늘의 일정" value={todayAgendas.length} isLoading={isLoading} />
        <StatCard title="이번 주 마감" value={weekDeadlines.length} isLoading={isLoading} />
        <StatCard title="미완료 일정" value={incomplete.length} isLoading={isLoading} />
        <StatCard title="읽지 않은 알림" value={unreadCount} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's agendas */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">오늘의 일정</h2>
            <Link to="/agendas" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">전체 보기</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" variant="rectangular" />)}
            </div>
          ) : todayAgendas.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">오늘 예정된 일정이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {todayAgendas.slice(0, 5).map((agenda) => (
                <Link key={agenda.id} to={`/agendas/${agenda.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{agenda.title}</span>
                      <Badge className={AGENDA_TYPE_BG[agenda.type]}>{AGENDA_TYPE_LABELS[agenda.type]}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {format(new Date(agenda.startAt), 'HH:mm', { locale: ko })}{agenda.endAt ? ` ~ ${format(new Date(agenda.endAt), 'HH:mm', { locale: ko })}` : ''}
                    </p>
                  </div>
                  <Badge className={PRIORITY_COLORS[agenda.priority]}>{PRIORITY_LABELS[agenda.priority]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">최근 알림</h2>
            <Link to="/notifications" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">전체 보기</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton variant="circular" className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">알림이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((n) => (
                <Link key={n.id} to={n.agendaId ? `/agendas/${n.agendaId}` : '#'} className="flex gap-3 items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-slate-300 dark:bg-slate-600' : 'bg-primary-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${n.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {format(new Date(n.createdAt), 'M/d HH:mm', { locale: ko })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
