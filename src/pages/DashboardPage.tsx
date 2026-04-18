import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_BG, CATEGORY_LABELS, CATEGORY_BG } from '@/utils/constants';
import { format, isToday, isThisWeek, isSameDay, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, Badge, PageHeader, Skeleton, StatCardSkeleton } from '@/components/ui';
import api from '@/utils/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Agenda, ApiResponse } from '@/types';

// ─── 대시보드 전용 쿼리 (limit=50으로 최소화) ──────────────────────────────────
function useDashboardAgendas() {
  return useQuery({
    queryKey: queryKeys.agendas.dashboard(),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ items: Agenda[] }>>('/agendas?limit=50');
      return data.data.items;
    },
    staleTime: 5 * 60_000,
  });
}

// ─── 통계 카드 ────────────────────────────────────────────────────────────────
function StatCard({ title, value, isLoading, color = '', to }: {
  title: string;
  value: number | string;
  isLoading: boolean;
  color?: string;
  to?: string;
}) {
  const inner = (
    <Card className={to ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-16" variant="rectangular" />
      ) : (
        <p className={`text-2xl font-bold ${color || 'text-slate-900 dark:text-white'}`}>{value}</p>
      )}
    </Card>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return inner;
}

// ─── 대시보드 ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { data: agendas = [], isLoading: agendasLoading } = useDashboardAgendas();
  const { notifications, unreadCount, isLoading: notiLoading } = useNotifications();

  const todayAgendas = agendas.filter((a) => {
    if (a.isCompleted) return false;
    const now = new Date();
    const start = new Date(a.startAt);
    if (a.category === 'SCHEDULE') return isToday(start);
    // AGENDA: 오늘이 시작일~마감일 사이
    const deadline = a.deadline ? new Date(a.deadline) : null;
    return start <= now && (deadline === null || deadline >= new Date(now.toDateString()));
  });
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
            <StatCard title="오늘의 일정" value={todayAgendas.length} isLoading={false} to="/agendas" />
            <StatCard
              title="이번 주 마감"
              value={weekDeadlines.length}
              isLoading={false}
              color={weekDeadlines.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''}
              to="/agendas"
            />
            <StatCard
              title="미완료 일정"
              value={incomplete.length}
              isLoading={false}
              color={incomplete.length > 5 ? 'text-rose-600 dark:text-rose-400' : ''}
              to="/agendas?completed=false"
            />
            <StatCard
              title="읽지 않은 알림"
              value={unreadCount}
              isLoading={notiLoading}
              color={unreadCount > 0 ? 'text-primary-600 dark:text-primary-400' : ''}
              to="/notifications"
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
              {todayAgendas.slice(0, 7).map((agenda) => {
                const isSchedule = agenda.category === 'SCHEDULE';
                const startDate = new Date(agenda.startAt);
                const endDate = agenda.endAt ? new Date(agenda.endAt) : null;
                const deadlineDate = agenda.deadline ? new Date(agenda.deadline) : null;

                let timeInfo = '';
                if (isSchedule) {
                  const isMultiDay = endDate && !isSameDay(startDate, endDate);
                  if (isMultiDay) {
                    // 다일 스케줄: 날짜+요일+시간 모두 표기
                    timeInfo = format(startDate, 'M/d(EEE) HH:mm', { locale: ko });
                    timeInfo += ` ~ ${format(endDate!, 'M/d(EEE) HH:mm', { locale: ko })}`;
                  } else {
                    // 단일 스케줄: 시간만
                    timeInfo = format(startDate, 'HH:mm', { locale: ko });
                    if (endDate) timeInfo += ` ~ ${format(endDate, 'HH:mm', { locale: ko })}`;
                  }
                } else if (deadlineDate) {
                  const days = differenceInDays(deadlineDate, new Date());
                  const ampm = deadlineDate.getHours() < 12 ? '오전' : '오후';
                  timeInfo = days === 0 ? `오늘 마감 (${ampm})` : days < 0 ? `${Math.abs(days)}일 초과 (${ampm})` : `${days}일 후 마감 (${ampm})`;
                }

                const participantCount = agenda.participants.length;
                const extra = isSchedule ? agenda.location : agenda.reportMethod;

                return (
                  <Link
                    key={agenda.id}
                    to={`/agendas/${agenda.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {agenda.title}
                        </span>
                        <Badge className={CATEGORY_BG[agenda.category]}>
                          {CATEGORY_LABELS[agenda.category]}
                        </Badge>
                        {isSchedule && (
                          <Badge className={AGENDA_TYPE_BG[agenda.type]}>
                            {AGENDA_TYPE_LABELS[agenda.type]}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {timeInfo && (
                          <span className={`text-xs ${!isSchedule && deadlineDate && differenceInDays(deadlineDate, new Date()) <= 0 ? 'text-rose-500 dark:text-rose-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                            {timeInfo}
                          </span>
                        )}
                        {extra && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                            {isSchedule ? '📍' : '📋'} {extra}
                          </span>
                        )}
                        {participantCount > 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {participantCount}
                          </span>
                        )}
                        {agenda._count && agenda._count.comments > 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {agenda._count.comments}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {todayAgendas.length > 7 && (
                <Link
                  to="/agendas"
                  className="block text-center text-xs text-primary-600 dark:text-primary-400 pt-2"
                >
                  +{todayAgendas.length - 7}개 더보기
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
                      className={`text-sm line-clamp-2 ${
                        n.isRead
                          ? 'text-slate-500 dark:text-slate-400'
                          : 'text-slate-900 dark:text-white font-medium'
                      }`}
                    >
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
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
