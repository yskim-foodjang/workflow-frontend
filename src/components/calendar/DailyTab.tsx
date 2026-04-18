import { useMemo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, addDays, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

import clsx from 'clsx';
import type { Agenda } from '@/types';
import {
  getColor, formatHHMM, getWeekDays, daysLeft, getAmPm,
  getAgendasForDay, getScheduleStatus,
} from './calendarUtils';

interface Props {
  selectedDate: Date;
  agendas: Agenda[];
  holidays: Map<string, string>;
  onDateSelect: (d: Date) => void;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8..18
const HOUR_H = 52;
const GRID_START = 8;
const GRID_END = 19;

export default function DailyTab({ selectedDate, agendas, holidays, onDateSelect }: Props) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const isSelectedToday = selectedDate.toDateString() === new Date().toDateString();

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const activeAgendas = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd   = endOfDay(selectedDate);
    return agendas.filter(a => {
      if (a.category !== 'AGENDA' || a.isCompleted) return false;
      const start    = new Date(a.startAt);
      const deadline = a.deadline ? new Date(a.deadline) : null;
      return start <= dayEnd && (deadline === null || deadline >= dayStart);
    });
  }, [agendas, selectedDate]);

  // 단일 + 다일 포함 이 날짜와 겹치는 모든 SCHEDULE → 시간 그리드에 표시
  const daySchedules = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd   = endOfDay(selectedDate);
    return agendas
      .filter(a => {
        if (a.category !== 'SCHEDULE') return false;
        const start = new Date(a.startAt);
        const end   = a.endAt ? new Date(a.endAt) : start;
        return start <= dayEnd && end >= dayStart;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [agendas, selectedDate]);

  const weekDotColors = useMemo(() => (
    weekDays.map(d => {
      const items = getAgendasForDay(agendas, d);
      return items.length > 0 ? getColor(items[0]) : null;
    })
  ), [weekDays, agendas]);

  const nowH   = now.getHours();
  const nowTop = (nowH - GRID_START) * HOUR_H + (now.getMinutes() / 60) * HOUR_H;
  const isNowVisible = isSelectedToday && nowH >= GRID_START && nowH < GRID_END;

  useEffect(() => {
    if (gridRef.current && isNowVisible) {
      gridRef.current.scrollTop = Math.max(0, nowTop - 80);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {/* ── Date header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onDateSelect(addDays(selectedDate, -1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {format(selectedDate, 'M월 d일 EEE', { locale: ko })}
          </span>
          {/* 공휴일 배지 */}
          {holidays.get(format(selectedDate, 'yyyy-MM-dd')) && (
            <span className="text-xs px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-medium">
              {holidays.get(format(selectedDate, 'yyyy-MM-dd'))}
            </span>
          )}
          {isSelectedToday && (
            <span className="text-xs px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">
              오늘
            </span>
          )}
          {!isSelectedToday && (
            <button
              onClick={() => onDateSelect(new Date())}
              className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              오늘 이동
            </button>
          )}
        </div>
        <button
          onClick={() => onDateSelect(addDays(selectedDate, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Week strip ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-2">
        <div className="grid grid-cols-7">
          {weekDays.map((day, i) => {
            const isTodayCell = day.toDateString() === new Date().toDateString();
            const isSelected  = isSameDay(day, selectedDate) && !isTodayCell;
            const dotColor    = weekDotColors[i];
            const dow         = day.getDay();
            const holidayName = holidays.get(format(day, 'yyyy-MM-dd'));
            const isHoliday   = !!holidayName;
            return (
              <button
                key={i}
                onClick={() => onDateSelect(day)}
                className={clsx(
                  'flex flex-col items-center py-1 rounded-lg transition-colors',
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-700'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                )}
              >
                <span className={clsx(
                  'text-[10px] font-medium',
                  (dow === 0 || isHoliday) ? 'text-red-500' : dow === 6 ? 'text-[#378ADD]' : 'text-slate-400 dark:text-slate-500',
                )}>
                  {['일','월','화','수','목','금','토'][dow]}
                </span>
                <span className={clsx(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold tabular-nums mt-0.5',
                  isTodayCell
                    ? 'bg-[#185FA5] text-white'
                    : isHoliday
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-slate-700 dark:text-slate-200',
                )}>
                  {day.getDate()}
                </span>
                {/* 공휴일 점 or 일정 점 */}
                <div className="h-1.5 mt-0.5 flex items-center gap-[2px]">
                  {isHoliday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500" />
                  )}
                  {!isHoliday && dotColor && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 진행중 아젠다 ─────────────────────────────────────── */}
      {activeAgendas.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              진행중 아젠다
              <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">· {activeAgendas.length}건</span>
            </h3>
          </div>
          <div className="p-2 space-y-1.5">
            {activeAgendas.map(a => {
              const color = getColor(a);
              const dl    = a.deadline ? daysLeft(a.deadline) : null;
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/agendas/${a.id}`)}
                  className="w-full flex items-center hover:opacity-80 transition-opacity"
                >
                  <div
                    className="h-6 rounded flex-1 flex items-center justify-between px-2 text-[11px] font-medium text-white overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    <span className="truncate flex-1">{a.title}</span>
                    {dl !== null && a.deadline && (
                      <span className="ml-2 flex-shrink-0 text-white/80 tabular-nums">
                        {dl < 0 ? `D+${Math.abs(dl)}` : `D-${dl}`} {getAmPm(a.deadline)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Hour timeline ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div ref={gridRef} className="overflow-y-auto" style={{ maxHeight: 520 }}>
          <div className="relative" style={{ height: HOURS.length * HOUR_H }}>
            {/* Hour lines */}
            {HOURS.map((h, i) => (
              <div
                key={h}
                className="absolute w-full flex"
                style={{ top: i * HOUR_H, height: HOUR_H }}
              >
                <div className="w-12 flex-shrink-0 flex items-start justify-end pr-2 pt-0">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums -mt-2 select-none">
                    {h}:00
                  </span>
                </div>
                <div className="flex-1 border-t border-slate-100 dark:border-slate-700/60" />
              </div>
            ))}

            {/* Current time indicator */}
            {isNowVisible && (
              <div
                className="absolute w-full flex pointer-events-none z-10"
                style={{ top: nowTop }}
              >
                <div className="w-12 flex-shrink-0" />
                <div className="flex-1 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 -ml-1" />
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              </div>
            )}

            {/* Schedule blocks (단일 + 다일 모두, 해당 날 구간 계산) */}
            {daySchedules.map(a => {
              const aStart     = new Date(a.startAt);
              const aEnd       = a.endAt ? new Date(a.endAt) : aStart;
              const isStartDay = isSameDay(aStart, selectedDate);
              const isEndDay   = isSameDay(aEnd, selectedDate);
              // 이 날짜의 표시 구간
              const sH = isStartDay ? aStart.getHours()   : GRID_START;
              const sM = isStartDay ? aStart.getMinutes() : 0;
              const eH = isEndDay   ? aEnd.getHours()     : GRID_END;
              const eM = isEndDay   ? aEnd.getMinutes()   : 0;
              const top    = Math.max(0, (sH - GRID_START) * HOUR_H + (sM / 60) * HOUR_H);
              const bottom = Math.min(HOURS.length * HOUR_H, (eH - GRID_START) * HOUR_H + (eM / 60) * HOUR_H);
              if (top >= HOURS.length * HOUR_H || bottom <= 0) return null;
              const height = Math.max(22, bottom - top);
              const color  = getColor(a);
              const status = getScheduleStatus(a);

              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/agendas/${a.id}`)}
                  className={clsx(
                    'absolute rounded overflow-hidden text-left transition-opacity',
                    status === 'past' && 'opacity-50',
                  )}
                  style={{
                    top, height,
                    left: 48 + 4,
                    right: 4,
                    backgroundColor: `${color}18`,
                    borderLeft: status === 'current' ? '3px solid #EF4444' : `2px solid ${color}`,
                    borderTop:    isStartDay ? undefined : 'none',
                    borderBottom: isEndDay   ? undefined : 'none',
                    borderRadius: `${isStartDay ? 4 : 0}px ${isStartDay ? 4 : 0}px ${isEndDay ? 4 : 0}px ${isEndDay ? 4 : 0}px`,
                  }}
                >
                  <div className="px-2 py-1">
                    <div className="text-xs font-semibold truncate" style={{ color }}>{a.title}</div>
                    {height >= 40 && isStartDay && (
                      <div className="text-[10px] tabular-nums mt-0.5" style={{ color: `${color}99` }}>
                        {formatHHMM(a.startAt)}{a.endAt && ` – ${formatHHMM(a.endAt)}`}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 범례 ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-1 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#0D9488]" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">스케줄</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#8B5CF6]" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">아젠다</span>
        </div>
      </div>
    </div>
  );
}
