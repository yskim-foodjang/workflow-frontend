import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, isToday, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';
import type { Agenda } from '@/types';
import {
  getColor, getAmPm, daysLeft, formatHHMM,
  getMonthCells, getAgendasForDay, getActiveAgendas, getTodaySchedules, getScheduleStatus,
} from './calendarUtils';

interface Props {
  selectedDate: Date;
  displayMonth: Date;
  agendas: Agenda[];
  onDateSelect: (d: Date) => void;
  onMonthChange: (d: Date) => void;
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

export default function DashboardTab({ selectedDate, displayMonth, agendas, onDateSelect, onMonthChange }: Props) {
  const navigate = useNavigate();
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();

  const cells = useMemo(() => getMonthCells(year, month), [year, month]);
  const activeAgendas = useMemo(() => getActiveAgendas(agendas), [agendas]);
  const todaySchedules = useMemo(() => getTodaySchedules(agendas), [agendas]);

  return (
    <div className="space-y-4">
      {/* ── Mini Monthly Calendar ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onMonthChange(addMonths(displayMonth, -1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {format(displayMonth, 'yyyy년 M월', { locale: ko })}
          </span>
          <button
            onClick={() => onMonthChange(addMonths(displayMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DOW.map((d, i) => (
            <div
              key={d}
              className={clsx(
                'text-center text-xs font-medium py-1',
                i === 0 ? 'text-red-500' : i === 6 ? 'text-[#378ADD]' : 'text-slate-400 dark:text-slate-500',
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;

            const isCurrentMonth = day.getMonth() === month;
            const isTodayCell    = isToday(day);
            const isSelected     = isSameDay(day, selectedDate) && !isTodayCell;
            const dayAgendas     = getAgendasForDay(agendas, day);
            const colors         = dayAgendas.map(getColor);
            const total          = colors.length;
            const shown          = total >= 7 ? colors.slice(0, 5) : colors.slice(0, 6);
            const extra          = total >= 7 ? total - 5 : 0;
            const dow            = day.getDay();

            return (
              <button
                key={idx}
                onClick={() => onDateSelect(day)}
                className={clsx(
                  'flex flex-col items-center py-1 rounded-lg transition-colors',
                  isSelected ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  !isCurrentMonth && 'opacity-40',
                )}
              >
                <div
                  className={clsx(
                    'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium tabular-nums',
                    isTodayCell
                      ? 'bg-[#185FA5] text-white'
                      : dow === 0
                        ? 'text-red-500 dark:text-red-400'
                        : dow === 6
                          ? 'text-[#378ADD]'
                          : 'text-slate-700 dark:text-slate-200',
                  )}
                >
                  {day.getDate()}
                </div>

                {/* Dot grid (3 × 2) */}
                {total > 0 && (
                  <div className="grid grid-cols-3 gap-[1px] mt-[2px]">
                    {shown.map((color, i) => (
                      <div
                        key={i}
                        className="w-[3px] h-[3px] rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    {extra > 0 && (
                      <div className="text-[5px] leading-[3px] font-bold text-[#185FA5]">
                        +{extra}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 진행중 아젠다 ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            진행중 아젠다
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1.5">
              · {activeAgendas.length}건
            </span>
          </h3>
        </div>
        {activeAgendas.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            진행중인 아젠다가 없습니다.
          </p>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {activeAgendas.map(a => {
              const color = getColor(a);
              const dl    = a.deadline ? daysLeft(a.deadline) : null;
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/agendas/${a.id}`)}
                  className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {a.title}
                      </span>
                      {dl !== null && (
                        <span className={clsx(
                          'text-xs font-medium flex-shrink-0',
                          dl <= 3 ? 'text-[#A32D2D] dark:text-red-400' : 'text-slate-400 dark:text-slate-500',
                        )}>
                          {dl < 0 ? `${Math.abs(dl)}일 초과` : dl === 0 ? '오늘 마감' : `${dl}일 남음`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {format(new Date(a.startAt), 'M/d', { locale: ko })} 시작
                      {a.deadline && ` · ${format(new Date(a.deadline), 'M/d', { locale: ko })} ${getAmPm(a.deadline)} 마감`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 오늘 스케줄 ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            오늘 스케줄
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1.5">
              · {todaySchedules.length}건
            </span>
          </h3>
        </div>
        {todaySchedules.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            오늘 예정된 스케줄이 없습니다.
          </p>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {todaySchedules.map(a => {
              const color  = getColor(a);
              const status = getScheduleStatus(a);
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/agendas/${a.id}`)}
                  className={clsx(
                    'w-full px-3 py-2.5 flex items-center gap-3 transition-colors text-left relative',
                    status === 'past' && 'opacity-50',
                    status !== 'past' && 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                    status === 'current' && 'bg-red-50/50 dark:bg-red-900/10',
                  )}
                >
                  {status === 'current' && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 rounded-r" />
                  )}
                  <div className="text-xs tabular-nums text-slate-400 dark:text-slate-500 flex-shrink-0 w-10 text-right">
                    <div>{formatHHMM(a.startAt)}</div>
                    {a.endAt && <div className="opacity-70">{formatHHMM(a.endAt)}</div>}
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate flex-1">
                    {a.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
