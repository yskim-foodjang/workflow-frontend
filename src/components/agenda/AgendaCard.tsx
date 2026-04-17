import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_BG, PRIORITY_LABELS, PRIORITY_COLORS, CATEGORY_LABELS, CATEGORY_BG } from '@/utils/constants';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';
import { Card, Badge, AvatarGroup } from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import api from '@/utils/api';
import type { Agenda, ApiResponse } from '@/types';

interface AgendaCardProps {
  agenda: Agenda;
}

export default function AgendaCard({ agenda }: AgendaCardProps) {
  const queryClient = useQueryClient();
  const deadlineMs = agenda.deadline ? new Date(agenda.deadline).getTime() - Date.now() : null;

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
        <div className={clsx('w-1.5 rounded-full flex-shrink-0', agenda.category === 'AGENDA' ? 'bg-violet-400' : {
          'bg-blue-500':    agenda.type === 'MEETING',
          'bg-emerald-500': agenda.type === 'TASK',
          'bg-rose-500':    agenda.type === 'DEADLINE',
          'bg-amber-500':   agenda.type === 'TRIP',
          'bg-violet-500':  agenda.type === 'OTHER',
        })} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={clsx('font-medium truncate', agenda.isCompleted
              ? 'line-through text-slate-400 dark:text-slate-500'
              : 'text-slate-900 dark:text-white'
            )}>
              {agenda.title}
            </h3>
            <Badge className={CATEGORY_BG[agenda.category]}>{CATEGORY_LABELS[agenda.category]}</Badge>
            <Badge className={AGENDA_TYPE_BG[agenda.type]}>{AGENDA_TYPE_LABELS[agenda.type]}</Badge>
            <Badge className={PRIORITY_COLORS[agenda.priority]}>{PRIORITY_LABELS[agenda.priority]}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{format(new Date(agenda.startAt), 'M/d (EEE) HH:mm', { locale: ko })}</span>
            {agenda.deadline && (
              <span className={clsx('font-medium', {
                'text-rose-500':  deadlineMs !== null && deadlineMs < 24 * 60 * 60 * 1000,
                'text-amber-500': deadlineMs !== null && deadlineMs >= 24 * 60 * 60 * 1000 && deadlineMs < 3 * 24 * 60 * 60 * 1000,
              })}>
                마감: {format(new Date(agenda.deadline), 'M/d')}
              </span>
            )}
            {agenda.participants.length > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {agenda.participants.length}
              </span>
            )}
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
        <AvatarGroup names={agenda.participants.map((p) => p.user.name)} />
      </Card>
    </Link>
  );
}
