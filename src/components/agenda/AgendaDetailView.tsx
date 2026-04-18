import { CATEGORY_LABELS } from '@/utils/constants';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';
import { Card } from '@/components/ui';
import type { Agenda } from '@/types';

interface AgendaDetailViewProps {
  agenda: Agenda;
  deadlineDaysLeft: number | null;
}

export default function AgendaDetailView({ agenda, deadlineDaysLeft }: AgendaDetailViewProps) {
  return (
    <Card className="mb-4">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500 dark:text-slate-400 mb-1">구분</dt>
          <dd className="text-slate-900 dark:text-white font-medium">{CATEGORY_LABELS[agenda.category]}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400 mb-1">시작</dt>
          <dd className="text-slate-900 dark:text-white font-medium">
            {agenda.category === 'AGENDA'
              ? format(new Date(agenda.startAt), 'yyyy.M.d (EEE) a', { locale: ko })
              : format(new Date(agenda.startAt), 'yyyy.M.d (EEE) a h:mm', { locale: ko })}
          </dd>
        </div>
        {agenda.endAt && (
          <div>
            <dt className="text-slate-500 dark:text-slate-400 mb-1">종료</dt>
            <dd className="text-slate-900 dark:text-white font-medium">
              {agenda.category === 'AGENDA'
                ? format(new Date(agenda.endAt), 'yyyy.M.d (EEE) a', { locale: ko })
                : format(new Date(agenda.endAt), 'yyyy.M.d (EEE) a h:mm', { locale: ko })}
            </dd>
          </div>
        )}
        {agenda.deadline && (
          <div>
            <dt className="text-slate-500 dark:text-slate-400 mb-1">기한</dt>
            <dd className={clsx('font-medium', {
              'text-rose-600': deadlineDaysLeft !== null && deadlineDaysLeft <= 0,
              'text-amber-600': deadlineDaysLeft !== null && deadlineDaysLeft > 0 && deadlineDaysLeft <= 3,
              'text-slate-900 dark:text-white': deadlineDaysLeft === null || deadlineDaysLeft > 3,
            })}>
              {format(new Date(agenda.deadline), 'yyyy.M.d (EEE) a', { locale: ko })}
              {deadlineDaysLeft !== null && (
                <span className="ml-2 text-xs">
                  {deadlineDaysLeft <= 0 ? '(기한 초과)' : `(D-${deadlineDaysLeft})`}
                </span>
              )}
            </dd>
          </div>
        )}
        {agenda.location && (
          <div>
            <dt className="text-slate-500 dark:text-slate-400 mb-1">장소</dt>
            <dd className="text-slate-900 dark:text-white">{agenda.location}</dd>
          </div>
        )}
        {agenda.onlineLink && (
          <div>
            <dt className="text-slate-500 dark:text-slate-400 mb-1">온라인 링크</dt>
            <dd>
              <a href={agenda.onlineLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                {agenda.onlineLink}
              </a>
            </dd>
          </div>
        )}
        <div>
          <dt className="text-slate-500 dark:text-slate-400 mb-1">작성자</dt>
          <dd className="text-slate-900 dark:text-white">{agenda.createdBy.name} ({agenda.createdBy.department?.name})</dd>
        </div>
      </dl>

      {agenda.reportMethod && (
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">보고방식</h3>
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{agenda.reportMethod}</div>
        </div>
      )}

      {agenda.description && (
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">설명</h3>
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{agenda.description}</div>
        </div>
      )}

      {agenda.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {agenda.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
