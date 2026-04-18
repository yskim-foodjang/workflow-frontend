import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, addDays } from 'date-fns';
import clsx from 'clsx';
import api from '@/utils/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Agenda, ApiResponse } from '@/types';
import DashboardTab from './DashboardTab';
import WeeklyTab from './WeeklyTab';
import DailyTab from './DailyTab';

type CalendarTab = 'dashboard' | 'weekly' | 'daily';

const TABS: { key: CalendarTab; label: string }[] = [
  { key: 'dashboard', label: '월간' },
  { key: 'weekly',    label: '주간' },
  { key: 'daily',     label: '일간' },
];
const TAB_KEYS: CalendarTab[] = ['dashboard', 'weekly', 'daily'];

export default function CalendarView() {
  const [activeTab, setActiveTab] = useState<CalendarTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());

  const fetchRange = useMemo(() => {
    const today = new Date();
    if (activeTab === 'dashboard') {
      const monthStart = startOfMonth(displayMonth);
      const monthEnd   = endOfMonth(displayMonth);
      const start = addDays(new Date(Math.min(monthStart.getTime(), startOfDay(today).getTime())), -7);
      const end   = addDays(new Date(Math.max(monthEnd.getTime(), endOfDay(today).getTime())), 7);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    const ws = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const we = endOfWeek(selectedDate,   { weekStartsOn: 0 });
    return { start: ws.toISOString(), end: we.toISOString() };
  }, [activeTab, selectedDate, displayMonth]);

  const { data: agendas = [] } = useQuery({
    queryKey: queryKeys.agendas.calendar(fetchRange.start, fetchRange.end),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Agenda[]>>(
        `/agendas/calendar?start=${encodeURIComponent(fetchRange.start)}&end=${encodeURIComponent(fetchRange.end)}`
      );
      return data.data;
    },
    staleTime: 5 * 60_000,
  });

  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      const idx = TAB_KEYS.indexOf(activeTab);
      if (dx < 0 && idx < TAB_KEYS.length - 1) setActiveTab(TAB_KEYS[idx + 1]);
      if (dx > 0 && idx > 0)                    setActiveTab(TAB_KEYS[idx - 1]);
    }
    touchStartX.current = null;
  };

  const handleDateSelect = useCallback((date: Date) => setSelectedDate(date), []);
  const handleSwitchToDaily = useCallback((date: Date) => {
    setSelectedDate(date);
    setActiveTab('daily');
  }, []);

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Segmented control */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150',
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <DashboardTab
          selectedDate={selectedDate}
          displayMonth={displayMonth}
          agendas={agendas}
          onMonthChange={setDisplayMonth}
          onSwitchToDaily={handleSwitchToDaily}
        />
      )}
      {activeTab === 'weekly' && (
        <WeeklyTab
          selectedDate={selectedDate}
          agendas={agendas}
          onDateSelect={handleDateSelect}
          onSwitchToDaily={handleSwitchToDaily}
        />
      )}
      {activeTab === 'daily' && (
        <DailyTab
          selectedDate={selectedDate}
          agendas={agendas}
          onDateSelect={handleDateSelect}
        />
      )}
    </div>
  );
}
