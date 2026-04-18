import { isSameDay, differenceInCalendarDays, startOfWeek, addDays, startOfDay, endOfDay } from 'date-fns';
import type { Agenda } from '@/types';

export const TYPE_ACCENT: Record<string, string> = {
  MEETING:  '#3B82F6',
  TASK:     '#10B981',
  DEADLINE: '#F43F5E',
  TRIP:     '#F59E0B',
  OTHER:    '#8B5CF6',
  SCHEDULE: '#0D9488', // teal
  AGENDA:   '#8B5CF6', // violet
};

export const TYPE_LABEL: Record<string, string> = {
  MEETING:  '회의',
  TASK:     '업무',
  DEADLINE: '마감',
  TRIP:     '출장',
  OTHER:    '기타',
};

export function getColor(agenda: Agenda): string {
  if (agenda.category === 'SCHEDULE') return TYPE_ACCENT.SCHEDULE;
  return TYPE_ACCENT.AGENDA;
}

export function getAmPm(isoDate: string): '오전' | '오후' {
  return new Date(isoDate).getHours() < 12 ? '오전' : '오후';
}

export function daysLeft(deadline: string): number {
  return differenceInCalendarDays(new Date(deadline), new Date());
}

export function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/** SCHEDULE이고 startAt ≠ endAt 날짜인 다일(multi-day) 스케줄 여부 */
export function isMultiDaySchedule(agenda: Agenda): boolean {
  if (agenda.category !== 'SCHEDULE' || !agenda.endAt) return false;
  return !isSameDay(new Date(agenda.startAt), new Date(agenda.endAt));
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getMonthCells(year: number, month: number): Array<Date | null> {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function getAgendasForDay(agendas: Agenda[], day: Date): Agenda[] {
  const dayStart = startOfDay(day);
  const dayEnd   = endOfDay(day);
  return agendas.filter(a => {
    const start = new Date(a.startAt);
    if (a.category === 'SCHEDULE') {
      const end = a.endAt ? new Date(a.endAt) : start;
      return start <= dayEnd && end >= dayStart;
    }
    const deadline = a.deadline ? new Date(a.deadline) : null;
    return start <= dayEnd && (deadline === null || deadline >= dayStart);
  });
}

export function getActiveAgendas(agendas: Agenda[]): Agenda[] {
  const now   = new Date();
  const today = startOfDay(now);
  return agendas.filter(a => {
    if (a.category !== 'AGENDA' || a.isCompleted) return false;
    const start    = new Date(a.startAt);
    const deadline = a.deadline ? new Date(a.deadline) : null;
    return start <= now && (deadline === null || deadline >= today);
  });
}

/** 오늘 해당 스케줄 목록 (다일 스케줄도 오늘 범위 안이면 포함) */
export function getTodaySchedules(agendas: Agenda[]): Agenda[] {
  const todayStart = startOfDay(new Date());
  const todayEnd   = endOfDay(new Date());
  return agendas
    .filter(a => {
      if (a.category !== 'SCHEDULE') return false;
      const start = new Date(a.startAt);
      const end   = a.endAt ? new Date(a.endAt) : start;
      return start <= todayEnd && end >= todayStart;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function getScheduleStatus(agenda: Agenda): 'past' | 'current' | 'upcoming' {
  const now   = new Date();
  const start = new Date(agenda.startAt);
  const end   = agenda.endAt ? new Date(agenda.endAt) : null;
  if (end && end < now) return 'past';
  if (start <= now && (!end || end > now)) return 'current';
  if (start < now && !end) return 'past';
  return 'upcoming';
}
