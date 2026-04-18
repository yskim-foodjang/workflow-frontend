import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format, isSameDay, isToday, addWeeks,
  startOfDay, endOfDay, getISOWeek, startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';
import type { Agenda } from '@/types';
import { getColor, formatHHMM, getWeekDays, getAmPm, TYPE_ACCENT, isMultiDaySchedule } from './calendarUtils';

interface Props {
  selectedDate: Date;
  agendas: Agenda[];
  onDateSelect: (d: Date) => void;
  onSwitchToDaily: (d: Date) => void;
}

const HOURS      = Array.from({ length: 11 }, (_, i) => i + 8); // 8..18
const HOUR_H     = 44;
const GRID_START = 8;
const GRID_END   = 19;

export default function WeeklyTab({ selectedDate, agendas, onDateSelect, onSwitchToDaily }: Props) {
  const navigate = useNavigate();
  const [selectedSchedule, setSelectedSchedule] = useState<Agenda | null>(null);
  const [now, setNow] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // 이번 주 여부 — isSameWeek 대신 주 시작일 비교로 정확히 판단
  const isThisWeek = useMemo(() => {
    const thisStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    return isSameDay(weekDays[0], thisStart);
  }, [weekDays]);

  // 간트 영역: AGENDA + 다일 SCHEDULE
  const weekGanttItems = useMemo(() => {
    const wStart = startOfDay(weekDays[0]);
    const wEnd   = endOfDay(weekDays[6]);
    return agendas.filter(a => {
      const start = new Date(a.startAt);
      if (a.category === 'AGENDA') {
        const end = a.deadline ? new Date(a.deadline) : a.endAt ? new Date(a.endAt) : start;
        return start <= wEnd && end >= wStart;
      }
      if (isMultiDaySchedule(a)) {
        return start <= wEnd && new Date(a.endAt!) >= wStart;
      }
      return false;
    });
  }, [agendas, weekDays]);

  // 시간 그리드: 단일 SCHEDULE만
  const weekSchedules = useMemo(() => (
    agendas.filter(a =>
      a.category === 'SCHEDULE' &&
      !isMultiDaySchedule(a) &&
      weekDays.some(d => isSameDay(new Date(a.startAt), d))
    )
  ), [agendas, weekDays]);

  const weekLabel = useMemo(() => {
    const wn = getISOWeek(weekDays[0]);
    return `${format(weekDays[0], 'M월', { locale: ko })} ${wn}주`;
  }, [weekDays]);

  const nowH         = now.getHours();
  const nowTop       = (nowH - GRID_START) * HOUR_H + (now.getMinutes() / 60) * HOUR_H;
  const isNowVisible = nowH >= GRID_START && nowH < GRID_END;

  useEffect(() => {
    if (gridRef.current && isNowVisible) {
      gridRef.current.scrollTop = Math.max(0, nowTop - 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 간트 아이템 끝날짜 계산
  function ganttEnd(a: Agenda): Date {
    if (a.category === 'AGENDA') {
      return a.deadline ? new Date(a.deadline) : a.endAt ? new Date(a.endAt) : new Date(a.startAt);
    }
    return a.endAt ? new Date(a.endAt) : new Date(a.startAt);
  }

  return (
    <div className="space-y-3">
      {/* ── Week nav ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onDateSelect(addWeeks(selectedDate, -1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{weekLabel}</span>
          {isThisWeek && (
            <span className="text-xs px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">
              이번 주
            </span>
          )}
          {!isThisWeek && (
            <button
              onClick={() => onDateSelect(new Date())}
              className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              오늘로
            </button>
          )}
        </div>
        <button
          onClick={() => onDateSelect(addWeeks(selectedDate, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Main grid card ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* 7-day header */}
        <div className="grid grid-cols-[32px_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-700">
          <div />
          {weekDays.map((day, i) => {
            const isTodayCell = isToday(day);
            const isSelected  = isSameDay(day, selectedDate) && !isTodayCell;
            const dow         = day.getDay();
            return (
              <button
                key={i}
                onClick={() => onSwitchToDaily(day)}
                className={clsx(
                  'flex flex-col items-center py-2 transition-colors',
                  isSelected ? 'bg-slate-50 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30',
                )}
              >
                <span className={clsx(
                  'text-[10px] font-medium',
                  dow === 0 ? 'text-red-500' : dow === 6 ? 'text-[#378ADD]' : 'text-slate-400 dark:text-slate-500',
                )}>
                  {['일','월','화','수','목','금','토'][dow]}
                </span>
                <span className={clsx(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold tabular-nums mt-0.5',
                  isTodayCell ? 'bg-[#185FA5] text-white' : 'text-slate-700 dark:text-slate-200',
                )}>
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Gantt area (AGENDA + 다일 SCHEDULE) */}
        {weekGanttItems.length > 0 && (
          <div className="border-b border-slate-100 dark:border-slate-700 px-2 py-1.5 space-y-1">
            {weekGanttItems.map(a => {
              const color  = getColor(a);
              const aStart = new Date(a.startAt);
              const aEnd   = ganttEnd(a);
              let firstCol = -1, lastCol = -1;
              weekDays.forEach((d, i) => {
                if (aStart <= endOfDay(d) && aEnd >= startOfDay(d)) {
                  if (firstCol < 0) firstCol = i;
                  lastCol = i;
                }
              });
              if (firstCol < 0) return null;
              const span             = lastCol - firstCol + 1;
              const continuesBefore  = aStart < startOfDay(weekDays[0]);
              const continuesAfter   = aEnd   > endOfDay(weekDays[6]);
              const isDeadlineInWeek = a.category === 'AGENDA' && a.deadline && weekDays.some(d => isSameDay(new Date(a.deadline!), d));
              return (
                <div key={a.id} className="relative h-6">
                  <button
                    onClick={() => navigate(`/agendas/${a.id}`)}
                    className="absolute h-5 top-0.5 flex items-center gap-0.5 px-1.5 text-[10px] font-medium text-white overflow-hidden"
                    style={{
                      left:  `${firstCol * (100 / 7)}%`,
                      width: `${span * (100 / 7)}%`,
                      backgroundColor: color,
                      borderRadius: `${continuesBefore ? 0 : 3}px ${continuesAfter ? 0 : 3}px ${continuesAfter ? 0 : 3}px ${continuesBefore ? 0 : 3}px`,
                    }}
                  >
                    {continuesBefore && <span className="flex-shrink-0">←</span>}
                    <span className="truncate flex-1">{a.title}</span>
                    {isDeadlineInWeek && a.deadline && (
                      <span className="ml-1 text-[8px] bg-white/25 px-0.5 rounded flex-shrink-0">
                        {getAmPm(a.deadline)}마감
                      </span>
                    )}
                    {continuesAfter && <span className="flex-shrink-0">→</span>}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Time grid */}
        <div ref={gridRef} className="overflow-y-auto" style={{ maxHeight: 440 }}>
          <div className="flex" style={{ height: HOURS.length * HOUR_H }}>
            {/* Hour labels */}
            <div className="w-8 flex-shrink-0 relative">
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-slate-100 dark:border-slate-700/60"
                  style={{ top: i * HOUR_H, height: HOUR_H }}
                >
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums absolute right-1 -top-2 select-none">
                    {h}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, colIdx) => {
              const isTodayCol   = isToday(day);
              const colSchedules = weekSchedules.filter(a => isSameDay(new Date(a.startAt), day));
              return (
                <div
                  key={colIdx}
                  className={clsx(
                    'flex-1 relative border-l border-slate-100 dark:border-slate-700/60',
                    isTodayCol && 'bg-blue-50/20 dark:bg-blue-900/5',
                  )}
                >
                  {HOURS.map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full border-t border-slate-100 dark:border-slate-700/60"
                      style={{ top: i * HOUR_H, height: HOUR_H }}
                    />
                  ))}
                  {isTodayCol && isNowVisible && (
                    <div
                      className="absolute w-full z-10 pointer-events-none flex items-center"
                      style={{ top: nowTop }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 -ml-[3px]" />
                      <div className="flex-1 h-px bg-red-500" />
                    </div>
                  )}
                  {colSchedules.map(a => {
                    const sH     = new Date(a.startAt).getHours();
                    const sM     = new Date(a.startAt).getMinutes();
                    const eH     = a.endAt ? new Date(a.endAt).getHours()   : sH + 1;
                    const eM     = a.endAt ? new Date(a.endAt).getMinutes() : sM;
                    const top    = Math.max(0, (sH - GRID_START) * HOUR_H + (sM / 60) * HOUR_H);
                    const bottom = Math.min(HOURS.length * HOUR_H, (eH - GRID_START) * HOUR_H + (eM / 60) * HOUR_H);
                    const height = Math.max(18, bottom - top);
                    const color  = getColor(a);
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedSchedule(prev => prev?.id === a.id ? null : a)}
                        className="absolute z-10 rounded overflow-hidden text-left"
                        style={{ top, height, left: 1, right: 1, backgroundColor: `${color}22`, borderLeft: `2px solid ${color}` }}
                      >
                        <div className="px-0.5 py-0.5">
                          <div className="text-[10px] font-semibold tabular-nums leading-tight" style={{ color }}>
                            {`${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`}
                          </div>
                          {height >= 36 && (
                            <div className="text-[9px] truncate leading-tight" style={{ color }}>{a.title}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedSchedule && (
        <ScheduleDetailPanel
          agenda={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onNavigate={() => { navigate(`/agendas/${selectedSchedule.id}`); setSelectedSchedule(null); }}
        />
      )}

      {/* ── Legend: 스케줄 + 아젠다 ──────────────────────────── */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: TYPE_ACCENT.SCHEDULE }} />
          <span className="text-xs text-slate-500 dark:text-slate-400">스케줄</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: TYPE_ACCENT.AGENDA }} />
          <span className="text-xs text-slate-500 dark:text-slate-400">아젠다</span>
        </div>
      </div>
    </div>
  );
}

function ScheduleDetailPanel({ agenda, onClose, onNavigate }: { agenda: Agenda; onClose: () => void; onNavigate: () => void }) {
  const color  = getColor(agenda);
  const startH = new Date(agenda.startAt).getHours();
  const startM = new Date(agenda.startAt).getMinutes();
  const durationText = (() => {
    if (!agenda.endAt) return null;
    const mins = Math.round((new Date(agenda.endAt).getTime() - new Date(agenda.startAt).getTime()) / 60_000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `(${h > 0 ? `${h}시간 ` : ''}${m > 0 ? `${m}분` : ''})`.trim();
  })();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{agenda.title}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-3">
          <div className="tabular-nums">
            {`${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`}
            {agenda.endAt && ` – ${formatHHMM(agenda.endAt)}`}
            {durationText && ` ${durationText}`}
          </div>
          {agenda.location && <div>📍 {agenda.location}</div>}
        </div>
        <button
          onClick={onNavigate}
          className="w-full py-2 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          자세히 보기
        </button>
      </div>
    </div>
  );
}
