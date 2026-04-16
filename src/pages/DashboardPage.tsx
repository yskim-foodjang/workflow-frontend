import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_BG, PRIORITY_LABELS, PRIORITY_COLORS } from '@/utils/constants';
import { format, isToday, isThisWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, Badge, PageHeader, Skeleton, StatCardSkeleton } from '@/components/ui';
import api from '@/utils/api';
import type { Agenda, ApiResponse } from '@/types';

// ─── 대시보드 전용 쿼리 (limit=50으로 최소화) ──────────────────────────────────
function useDashboardAgendas() {
  return useQuery({
    queryKey: ['agendas', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ items: Agenda[] }>>('/agendas?limit=50');
      return data.data.items;
    },
    staleTime: 5 * 60_000,
  });
}

// ─── 통계 카드 ────────────────────────────────────────────────────────────────
function StatCard({ title, value, isLoading, color = '' }: {
  title: string;
  value: number | string;
  isLoading: boolean;
  color?: string;
}) {
  return (
    <Card>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-16" variant="rectangular" />
      ) : (
        <p className={`text-2xl font-bold ${color || 'text-slate-900 dark:text-white'}`}>{value}</p>
      )}
    </Card>
  );
}

// ─── 대시보드 ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { data: agendas = [], isLoading: agendasLoading } = useDashboardAgendas();
  const { notifications, unreadCount, isLoading: notiLoading } = useNotifications();

  const todayAgendas = agendas.filter((a) => isToday(new Date(a.startAt)));
  const weekDeadlines = agendas.filter(
    (a) => a.deadline && isThisWeek(new Date(a.deadline), { weekStartsOn: 1 })
  );
  const incomplete = agendas.filter((a) => !a.isCompleted);

  const isLoading = agendasLoading;

  return (
    <div>
      <PageHeader title={`안녕하세요, ${user?.name}님 👋`} />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard title="오늘의 일정" value={todayAgendas.length} isLoading={false} />
            <StatCard
              title="이번 주 마감"
              value={weekDeadlines.length}
              isLoading={false}
              color={weekDeadlines.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''}
            />
            <StatCard
              title="미완료 일정"
              value={incomplete.length}
              isLoading={false}
              color={incomplete.length > 5 ? 'text-rose-600 dark:text-rose-400' : ''}
            />
            <StatCard
              title="읽지 않은 알림"
              value={unreadCount}
              isLoading={notiLoading}
              color={unreadCount > 0 ? 'text-primary-600 dark:text-primary-400' : ''}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 오늘의 일정 */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">오늘의 일정</h2>
            <Link
              to="/agendas"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              전체 보기
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" variant="rectangular" />
              ))}
            </div>
          ) : todayAgendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-400 dark:text-slate-500">오늘 예정된 일정이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {todayAgendas.slice(0, 5).map((agenda) => (
                <Link
                  key={agenda.id}
                  to={`/agendas/${agenda.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {agenda.title}
                      </span>
                      <Badge className={AGENDA_TYPE_BG[agenda.type]}>
                        {AGENDA_TYPE_LABELS[agenda.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {format(new Date(agenda.startAt), 'HH:mm', { locale: ko })}
                      {agenda.endAt ? ` ~ ${format(new Date(agenda.endAt), 'HH:mm', { locale: ko })}` : ''}
                    </p>
                  </div>
                  <Badge className={PRIORITY_COLORS[agenda.priority]}>
                    {PRIORITY_LABELS[agenda.priority]}
                  </Badge>
                </Link>
              ))}
              {todayAgendas.length > 5 && (
                <Link
                  to="/agendas"
                  className="block text-center text-xs text-primary-600 dark:text-primary-400 pt-2"
                >
                  +{todayAgendas.length - 5}개 더보기
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* 최근 알림 */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">최근 알림</h2>
            <Link
              to="/notifications"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              전체 보기
            </Link>
          </div>
          {notiLoading ? (
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-slate-400 dark:text-slate-500">알림이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((n) => (
                <Link
                  key={n.id}
                  to={n.agendaId ? `/agendas/${n.agendaId}` : '#'}
                  className="flex gap-3 items-start hover:opacity-80 transition-opacity"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      n.isRead ? 'bg-slate-300 dark:bg-slate-600' : 'bg-primary-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        n.isRead
                          ? 'text-slate-500 dark:text-slate-400'
                          : 'text-slate-900 dark:text-white font-medium'
                      }`}
                    >
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
