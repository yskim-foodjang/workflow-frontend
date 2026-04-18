import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_BG, CATEGORY_LABELS, CATEGORY_BG } from '@/utils/constants';
import { format, differenceInCalendarDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';
import { Card, Badge, AvatarGroup } from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import api from '@/utils/api';
import type { Agenda, ApiResponse } from '@/types';

type DdayInfo = { label: string; color: string };

/** 아젠다 마감일 기준 — 초과 시 '기한초과' */
function getAgendaDday(deadline: string, isCompleted: boolean): DdayInfo | null {
  if (isCompleted) return null;
  const diff = differenceInCalendarDays(new Date(deadline), new Date());
  if (diff > 0)   return { label: `D-${diff}`, color: diff <= 3 ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' : 'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400' };
  if (diff === 0) return { label: 'D-0',        color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400' };
  return                  { label: '기한초과',   color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400' };
}

/** 스케줄 시작일 기준 — 지난 일정은 null (기한초과 없음) */
function getScheduleDday(startAt: string): DdayInfo | null {
  const diff = differenceInCalendarDays(new Date(startAt), new Date());
  if (diff < 0)   return null;
  if (diff === 0) return { label: 'D-0',       color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400' };
  return                  { label: `D-${diff}`, color: diff <= 3 ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' : 'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400' };
}

interface AgendaCardProps {
  agenda: Agenda;
}

export default function AgendaCard({ agenda }: AgendaCardProps) {
  const queryClient = useQueryClient();
  const deadlineMs  = agenda.deadline ? new Date(agenda.deadline).getTime() - Date.now() : null;
  const ddayInfo    = agenda.category === 'AGENDA'
    ? (agenda.deadline ? getAgendaDday(agenda.deadline, agenda.isCompleted) : null)
    : getScheduleDday(agenda.startAt);

  // 카드에 마우스를 올리면 상세 데이터를 미리 prefetch
  const handleMouseEnter = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.agendas.detail(agenda.id),
      queryFn: async () => {
        const { data } = await api.get<ApiResponse<Agenda>>(`/agendas/${agenda.id}`);
        return data.data;
      },
      // 이미 캐시에 있으면 재요청 안 함
      staleTime: 5 * 60_000,
    });
  }, [agenda.id, queryClient]);

  return (
    <Link to={`/agendas/${agenda.id}`} className="block" onMouseEnter={handleMouseEnter}>
      <Card padding="sm" className="flex gap-3 hover:shadow-md transition-shadow">
        <div className={clsx('w-1.5 rounded-full flex-shrink-0',
          agenda.category === 'AGENDA' ? 'bg-violet-400' : 'bg-teal-500'
        )} />
        <div className="flex-1 min-w-0">
          {/* ── 제목 줄: [제목 + 배지들] ─────── [아바타] ── */}
          <div className="flex items-center gap-2 mb-1">
            {/* 제목 + 배지 묶음 (flex-1로 공간 차지, 제목만 truncate) */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <h3 className={clsx('font-medium truncate min-w-0 shrink', agenda.isCompleted
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-900 dark:text-white'
              )}>
                {agenda.title}
              </h3>
              <Badge className={clsx(CATEGORY_BG[agenda.category], 'flex-shrink-0')}>
                {CATEGORY_LABELS[agenda.category]}
              </Badge>
              {agenda.category === 'SCHEDULE' && (
                <Badge className={clsx(AGENDA_TYPE_BG[agenda.type], 'flex-shrink-0')}>
                  {AGENDA_TYPE_LABELS[agenda.type]}
                </Badge>
              )}
            </div>
            {/* 아바타 — 오른쪽 고정 */}
            {agenda.participants.length > 0 && (
              <AvatarGroup names={agenda.participants.map((p) => p.user.name)} />
            )}
          </div>

          {/* ── 메타 줄 ───────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
            {/* 날짜 */}
            {agenda.category === 'SCHEDULE' ? (
              <span>{format(new Date(agenda.startAt), 'M/d (EEE) HH:mm', { locale: ko })}</span>
            ) : (
              <span>{format(new Date(agenda.startAt), 'M/d (EEE)', { locale: ko })}</span>
            )}

            {/* 아젠다: 마감일 */}
            {agenda.category === 'AGENDA' && agenda.deadline && (
              <span className={clsx('font-medium', {
                'text-rose-500':  deadlineMs !== null && deadlineMs < 24 * 60 * 60 * 1000,
                'text-amber-500': deadlineMs !== null && deadlineMs >= 24 * 60 * 60 * 1000 && deadlineMs < 3 * 24 * 60 * 60 * 1000,
              })}>
                {(() => {
                  const d = new Date(agenda.deadline);
                  const ampm = d.getHours() < 12 ? '오전' : '오후';
                  return `마감 ${format(d, 'M/d')}(${ampm})`;
                })()}
              </span>
            )}

            {/* D-day 배지 (아젠다·스케줄 공통) */}
            {ddayInfo && (
              <span className={clsx('font-semibold px-1.5 py-0.5 rounded-md', ddayInfo.color)}>
                {ddayInfo.label}
              </span>
            )}

            {/* 아젠다 전용: 보고방식 */}
            {agenda.category === 'AGENDA' && agenda.reportMethod && (
              <span className="truncate max-w-[120px]" title={agenda.reportMethod}>
                {agenda.reportMethod}
              </span>
            )}

            {/* 댓글 수 */}
            {agenda._count && agenda._count.comments > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {agenda._count.comments}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
