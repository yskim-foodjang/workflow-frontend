import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, isToday, isThisMonth, addMonths, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';
import type { Agenda } from '@/types';
import {
  getColor, getAmPm, daysLeft, formatHHMM,
  getMonthCells, getAgendasForDay, getActiveAgendas, getTodaySchedules,
  getScheduleStatus, isMultiDaySchedule, TYPE_LABEL,
} from './calendarUtils';

interface Props {
  selectedDate: Date;
  displayMonth: Date;
  agendas: Agenda[];
  holidays: Map<string, string>;
  onMonthChange: (d: Date) => void;
  onSwitchToDaily: (d: Date) => void;
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

export default function DashboardTab({ selectedDate, displayMonth, agendas, holidays, onMonthChange, onSwitchToDaily }: Props) {
  const navigate = useNavigate();
  const year  = displayMonth.getFullYear();
  const month = displayMonth.getMonth();

  const cells         = useMemo(() => getMonthCells(year, month), [year, month]);
  const activeAgendas = useMemo(() => getActiveAgendas(agendas), [agendas]);
  const todaySchedules = useMemo(() => getTodaySchedules(agendas), [agendas]);

  // Group cells into week rows for gantt rendering
  const weeks = useMemo(() => {
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cells]);

  // Multi-day schedules per week row
  const weekGanttItems = useMemo(() => (
    weeks.map(weekCells => {
      const validDays = weekCells.filter((d): d is Date => d !== null);
      if (validDays.length === 0) return [];
      const wStart = startOfDay(validDays[0]);
      const wEnd   = endOfDay(validDays[validDays.length - 1]);
      return agendas.filter(a => {
        if (!isMultiDaySchedule(a)) return false;
        const aStart = new Date(a.startAt);
        const aEnd   = new Date(a.endAt!);
        return aStart <= wEnd && aEnd >= wStart;
      });
    })
  ), [weeks, agendas]);

  return (
    <div className="space-y-4">
      {/* ── Mini Monthly Calendar ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onMonthChange(addMonths(displayMonth, -1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {format(displayMonth, 'yyyy년 M월', { locale: ko })}
            </span>
            {isThisMonth(displayMonth) ? (
              <span className="text-xs px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">
                이번 달
              </span>
            ) : (
              <button
                onClick={() => onMonthChange(new Date())}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                이번 달 이동
              </button>
            )}
          </div>
          <button
            onClick={() => onMonthChange(addMonths(displayMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* DOW headers */}
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

        {/* Week rows + gantt bars */}
        {weeks.map((weekCells, weekIdx) => {
          const ganttItems = weekGanttItems[weekIdx];
          return (
            <div key={weekIdx}>
              {/* Date cells */}
              <div className="grid grid-cols-7">
                {weekCells.map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  const isCurrentMonth = day.getMonth() === month;
                  const isTodayCell    = isToday(day);
                  const isSelected     = isSameDay(day, selectedDate) && !isTodayCell;
                  const dayAgendas     = getAgendasForDay(agendas, day);
                  // 간트바로 이미 표시되는 다일 스케줄은 점에서 제외
                  const dotAgendas     = dayAgendas.filter(a => !isMultiDaySchedule(a));
                  const colors         = dotAgendas.map(a =>
                    a.category === 'AGENDA' && a.deadline && isSameDay(new Date(a.deadline), day)
                      ? '#EF4444'
                      : getColor(a)
                  );
                  const total          = colors.length;
                  const shown          = total >= 7 ? colors.slice(0, 5) : colors.slice(0, 6);
                  const extra          = total >= 7 ? total - 5 : 0;
                  const dow            = day.getDay();
                  const holidayName    = holidays.get(format(day, 'yyyy-MM-dd'));
                  const isHoliday      = !!holidayName;
                  return (
                    <button
                      key={idx}
                      onClick={() => onSwitchToDaily(day)}
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
                            : (dow === 0 || isHoliday)
                              ? 'text-red-500 dark:text-red-400'
                              : dow === 6
                                ? 'text-[#378ADD]'
                                : 'text-slate-700 dark:text-slate-200',
                        )}
                      >
                        {day.getDate()}
                      </div>
                      {/* 공휴일명 */}
                      {holidayName && (
                        <span className="text-[7px] leading-tight text-red-500 dark:text-red-400 truncate w-full text-center px-0.5 mt-[1px]">
                          {holidayName}
                        </span>
                      )}
                      {total > 0 && (
                        <div className="grid grid-cols-3 gap-[1px] mt-[2px]">
                          {shown.map((color, i) => (
                            <div key={i} className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: color }} />
                          ))}
                          {extra > 0 && (
                            <div className="text-[5px] leading-[3px] font-bold text-[#185FA5]">+{extra}</div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Gantt bars for multi-day schedules in this week */}
              {ganttItems.length > 0 && (
                <div className="relative mx-0.5 mb-1" style={{ height: ganttItems.length * 18 }}>
                  {ganttItems.map((a, rowIdx) => {
                    const color  = getColor(a);
                    const aStart = new Date(a.startAt);
                    const aEnd   = new Date(a.endAt!);
                    let firstCol = -1, lastCol = -1;
                    weekCells.forEach((d, i) => {
                      if (!d) return;
                      if (aStart <= endOfDay(d) && aEnd >= startOfDay(d)) {
                        if (firstCol < 0) firstCol = i;
                        lastCol = i;
                      }
                    });
                    if (firstCol < 0) return null;
                    const span = lastCol - firstCol + 1;
                    const validDays    = weekCells.filter((d): d is Date => d !== null);
                    const continuesBefore = validDays.length > 0 && aStart < startOfDay(validDays[0]);
                    const continuesAfter  = validDays.length > 0 && aEnd   > endOfDay(validDays[validDays.length - 1]);
                    return (
                      <button
                        key={a.id}
                        onClick={() => navigate(`/agendas/${a.id}`)}
                        className="absolute flex items-center px-1 text-[9px] font-medium text-white overflow-hidden"
                        style={{
                          top: rowIdx * 18 + 1,
                          height: 15,
                          left:  `${firstCol * (100 / 7)}%`,
                          width: `${span * (100 / 7)}%`,
                          backgroundColor: color,
                          borderRadius: `${continuesBefore ? 0 : 2}px ${continuesAfter ? 0 : 2}px ${continuesAfter ? 0 : 2}px ${continuesBefore ? 0 : 2}px`,
                        }}
                      >
                        {continuesBefore ? '' : <span className="truncate">{a.title}</span>}
                        {continuesAfter && <span className="ml-auto flex-shrink-0">→</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 진행중 아젠다 ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            진행중 아젠다
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1.5">· {activeAgendas.length}건</span>
          </h3>
        </div>
        {activeAgendas.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">진행중인 아젠다가 없습니다.</p>
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
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.title}</span>
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
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1.5">· {todaySchedules.length}건</span>
          </h3>
        </div>
        {todaySchedules.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">오늘 예정된 스케줄이 없습니다.</p>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {todaySchedules.map(a => {
              const color   = getColor(a);
              const status  = getScheduleStatus(a);
              const isMulti = isMultiDaySchedule(a);
              // 시간 정보 — 단일: HH:mm ~ HH:mm / 다일: M/d(EEE) HH:mm ~ M/d(EEE) HH:mm
              const timeText = isMulti
                ? `${format(new Date(a.startAt), 'M/d(EEE) HH:mm', { locale: ko })}${a.endAt ? ` ~ ${format(new Date(a.endAt), 'M/d(EEE) HH:mm', { locale: ko })}` : ''}`
                : `${formatHHMM(a.startAt)}${a.endAt ? ` ~ ${formatHHMM(a.endAt)}` : ''}`;
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/agendas/${a.id}`)}
                  className={clsx(
                    'w-full px-3 py-2.5 flex items-center gap-2.5 transition-colors text-left relative',
                    status === 'past' && 'opacity-50',
                    status !== 'past' && 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                    status === 'current' && 'bg-red-50/50 dark:bg-red-900/10',
                  )}
                >
                  {status === 'current' && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 rounded-r" />
                  )}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.title}</span>
                      {TYPE_LABEL[a.type] && (
                        <span
                          className="text-[10px] px-1 py-0.5 rounded flex-shrink-0"
                          style={{ backgroundColor: `${color}22`, color }}
                        >
                          {TYPE_LABEL[a.type]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeText}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
