import { useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg, DatesSetArg, EventContentArg } from '@fullcalendar/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { AGENDA_TYPE_COLORS, AGENDA_TYPE_LABELS } from '@/utils/constants';
import { BRAND_COLOR, BRAND_PALETTE } from '@/config/app';
import { Card } from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import type { Agenda, ApiResponse } from '@/types';

// 일정(SCHEDULE) 전용 색상 - teal 계열
const SCHEDULE_COLOR = '#0d9488'; // teal-600
const SCHEDULE_BG = '#ccfbf1';    // teal-100

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}

function formatDateFull(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 커스텀 이벤트 렌더러
function EventContent({ arg }: { arg: EventContentArg }) {
  const agenda = arg.event.extendedProps.agenda as Agenda;
  const isSchedule = agenda.category === 'SCHEDULE';
  const isListView = arg.view.type.includes('list');

  if (isListView) {
    return (
      <div className="flex items-center gap-2 w-full py-0.5">
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
          style={
            isSchedule
              ? { backgroundColor: SCHEDULE_BG, color: SCHEDULE_COLOR }
              : { backgroundColor: `${arg.event.backgroundColor}20`, color: arg.event.backgroundColor }
          }
        >
          {isSchedule ? '일정' : AGENDA_TYPE_LABELS[agenda.type] ?? '기타'}
        </span>
        <span className="font-medium text-sm truncate">{agenda.title}</span>
        {isSchedule && agenda.startAt && (
          <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-auto">
            {formatTime(agenda.startAt)}
            {agenda.endAt ? ` ~ ${formatTime(agenda.endAt)}` : ''}
          </span>
        )}
        {!isSchedule && agenda.deadline && (
          <span className="text-xs text-rose-500 flex-shrink-0 ml-auto">
            마감 {formatDate(agenda.deadline)}
          </span>
        )}
      </div>
    );
  }

  if (isSchedule) {
    return (
      <div className="flex items-center gap-1 px-1 w-full overflow-hidden">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-medium truncate">
          {agenda.startAt ? `${formatTime(agenda.startAt)} ` : ''}{agenda.title}
        </span>
      </div>
    );
  }

  // AGENDA
  return (
    <div className="flex items-center gap-1 px-1 w-full overflow-hidden">
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <span className="text-xs font-medium truncate">{agenda.title}</span>
    </div>
  );
}

// 상세 패널 컴포넌트
function DetailPanel({ agenda, onClose, onNavigate }: { agenda: Agenda; onClose: () => void; onNavigate: () => void }) {
  const isSchedule = agenda.category === 'SCHEDULE';
  const typeColor = AGENDA_TYPE_COLORS[agenda.type] || BRAND_COLOR;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* 헤더 스트라이프 */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: isSchedule ? SCHEDULE_COLOR : typeColor }}
      />

      <div className="p-4 sm:p-5">
        {/* 상단: 카테고리 + 닫기 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={
                isSchedule
                  ? { backgroundColor: `${SCHEDULE_COLOR}18`, color: SCHEDULE_COLOR }
                  : { backgroundColor: `${typeColor}18`, color: typeColor }
              }
            >
              {isSchedule ? '일정' : AGENDA_TYPE_LABELS[agenda.type] ?? '기타'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 제목 */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 leading-snug">
          {agenda.title}
        </h3>

        {/* 정보 그리드 */}
        <div className="space-y-2.5">
          {isSchedule ? (
            // 일정 정보: 시간 중심
            <>
              {agenda.startAt && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  label="날짜"
                  value={formatDateFull(agenda.startAt)}
                />
              )}
              {agenda.startAt && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="시간"
                  value={
                    agenda.endAt
                      ? `${formatTime(agenda.startAt)} ~ ${formatTime(agenda.endAt)}`
                      : formatTime(agenda.startAt)
                  }
                />
              )}
              {agenda.location && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  label="장소"
                  value={agenda.location}
                />
              )}
            </>
          ) : (
            // 아젠다 정보: 시작일 + 마감기한 중심
            <>
              {agenda.startAt && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  label="시작일"
                  value={formatDateFull(agenda.startAt)}
                />
              )}
              {agenda.deadline && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="마감기한"
                  value={formatDateFull(agenda.deadline)}
                  valueClass="text-rose-600 dark:text-rose-400 font-semibold"
                />
              )}
              {agenda.endAt && !agenda.deadline && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                  label="종료일"
                  value={formatDateFull(agenda.endAt)}
                />
              )}
            </>
          )}

          {/* 설명 */}
          {agenda.description && (
            <div className="pt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">설명</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                {agenda.description}
              </p>
            </div>
          )}

          {/* 참여자 */}
          {agenda.participants && agenda.participants.length > 0 && (
            <InfoRow
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              label="참여자"
              value={agenda.participants.map((p) => p.user.name).join(', ')}
            />
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onNavigate}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: isSchedule ? SCHEDULE_COLOR : typeColor }}
          >
            자세히 보기
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueClass = '',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
        <p className={`text-sm text-slate-700 dark:text-slate-300 mt-0.5 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

export default function CalendarView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // useQuery로 캘린더 데이터 캐싱 (월 이동 시 깜빡임 없음)
  const { data: calendarAgendas } = useQuery({
    queryKey: dateRange
      ? queryKeys.agendas.calendar(dateRange.start, dateRange.end)
      : ['agendas', 'calendar', 'init'],
    queryFn: async () => {
      if (!dateRange) return [];
      const { data } = await api.get<ApiResponse<Agenda[]>>(
        `/agendas/calendar?start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}`
      );
      return data.data;
    },
    enabled: Boolean(dateRange),
    staleTime: 5 * 60_000,   // 5분 캐시 (캘린더는 자주 바뀌지 않음)
  });

  // 캘린더 이벤트로 변환
  const events: EventInput[] = (calendarAgendas ?? []).map((agenda) => {
    const isSchedule = agenda.category === 'SCHEDULE';
    const color = isSchedule ? SCHEDULE_COLOR : (AGENDA_TYPE_COLORS[agenda.type] || BRAND_COLOR);
    return {
      id: agenda.id,
      title: agenda.title,
      start: agenda.startAt,
      ...(agenda.endAt ? { end: agenda.endAt } : {}),
      backgroundColor: isSchedule ? `${SCHEDULE_COLOR}18` : `${color}18`,
      borderColor: color,
      textColor: color,
      extendedProps: { agenda },
      allDay: !isSchedule,
    };
  });

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    const newRange = { start: arg.startStr, end: arg.endStr };
    setDateRange(newRange);
    // 이전/다음 달 데이터를 미리 prefetch
    const nextStart = new Date(arg.startStr);
    nextStart.setMonth(nextStart.getMonth() + 1);
    const nextEnd = new Date(arg.endStr);
    nextEnd.setMonth(nextEnd.getMonth() + 1);
    queryClient.prefetchQuery({
      queryKey: queryKeys.agendas.calendar(nextStart.toISOString(), nextEnd.toISOString()),
      queryFn: async () => {
        const { data } = await api.get<ApiResponse<Agenda[]>>(
          `/agendas/calendar?start=${encodeURIComponent(nextStart.toISOString())}&end=${encodeURIComponent(nextEnd.toISOString())}`
        );
        return data.data;
      },
      staleTime: 5 * 60_000,
    });
  }, [queryClient]);

  const handleSelect = useCallback((selectInfo: DateSelectArg) => {
    const start = selectInfo.startStr;
    const end = selectInfo.endStr;
    navigate(`/agendas/new?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  }, [navigate]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const agenda = clickInfo.event.extendedProps.agenda as Agenda;
    setSelectedAgenda(agenda);
    // 상세 패널로 스크롤
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedAgenda(null);
  }, []);

  const handleNavigateDetail = useCallback(() => {
    if (selectedAgenda) {
      navigate(`/agendas/${selectedAgenda.id}`);
    }
  }, [selectedAgenda, navigate]);

  return (
    <div>
      <Card padding="sm" className="sm:p-6 calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          locale="ko"
          selectable
          selectMirror
          editable={false}
          events={events}
          datesSet={handleDatesSet}
          select={handleSelect}
          eventClick={handleEventClick}
          eventContent={(arg) => <EventContent arg={arg} />}
          height="auto"
          buttonText={{
            today: '오늘',
            month: '월',
            week: '주',
            day: '일',
            list: '목록',
          }}
          dayMaxEvents={3}
          moreLinkText={(n) => `+${n}개`}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false,
          }}
        />

        <style>{`
          .calendar-wrapper .fc {
            --fc-border-color: var(--tw-border-opacity, 1) rgb(226 232 240 / var(--tw-border-opacity));
            --fc-today-bg-color: ${BRAND_PALETTE[600]}0D;
            font-family: 'Pretendard Variable', 'Inter', system-ui, sans-serif;
            font-size: 14px;
          }
          .dark .calendar-wrapper .fc {
            --fc-border-color: rgb(51 65 85);
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: rgb(30 41 59);
            --fc-today-bg-color: ${BRAND_PALETTE[600]}1A;
            color: rgb(226 232 240);
          }
          .calendar-wrapper .fc .fc-button {
            background-color: ${BRAND_PALETTE[600]};
            border-color: ${BRAND_PALETTE[600]};
            font-size: 13px;
            padding: 6px 12px;
            border-radius: 8px;
          }
          .calendar-wrapper .fc .fc-button:hover {
            background-color: ${BRAND_PALETTE[700]};
          }
          .calendar-wrapper .fc .fc-button-active {
            background-color: ${BRAND_PALETTE[800]} !important;
          }
          .calendar-wrapper .fc .fc-toolbar-title {
            font-size: 1.25rem;
            font-weight: 700;
          }
          .calendar-wrapper .fc .fc-event {
            border-radius: 5px;
            border-width: 1.5px;
            border-left-width: 3px;
            padding: 1px 2px;
            font-size: 12px;
            cursor: pointer;
            background-color: transparent !important;
          }
          .calendar-wrapper .fc .fc-event:hover {
            filter: brightness(0.95);
          }
          .calendar-wrapper .fc .fc-daygrid-event {
            padding: 2px 3px;
          }
          .calendar-wrapper .fc .fc-daygrid-day-number {
            padding: 8px;
            font-size: 13px;
          }
          .calendar-wrapper .fc .fc-col-header-cell-cushion {
            padding: 8px;
            font-weight: 600;
            font-size: 13px;
          }
          .calendar-wrapper .fc .fc-list-event-title {
            width: 100%;
          }
          .calendar-wrapper .fc .fc-list-event-dot {
            display: none;
          }
          @media (max-width: 640px) {
            .calendar-wrapper .fc .fc-toolbar {
              flex-direction: column;
              gap: 8px;
            }
            .calendar-wrapper .fc .fc-toolbar-chunk {
              display: flex;
              justify-content: center;
            }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-in {
            animation: slideDown 0.2s ease-out;
          }
        `}</style>
      </Card>

      {/* 이벤트 범례 */}
      <div className="mt-3 flex items-center gap-4 flex-wrap px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-l-2 flex-shrink-0" style={{ borderColor: SCHEDULE_COLOR, backgroundColor: `${SCHEDULE_COLOR}18` }} />
          <span className="text-xs text-slate-500 dark:text-slate-400">일정 (시간 기반)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-l-2 flex-shrink-0" style={{ borderColor: AGENDA_TYPE_COLORS.MEETING, backgroundColor: `${AGENDA_TYPE_COLORS.MEETING}18` }} />
          <span className="text-xs text-slate-500 dark:text-slate-400">회의</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-l-2 flex-shrink-0" style={{ borderColor: AGENDA_TYPE_COLORS.TASK, backgroundColor: `${AGENDA_TYPE_COLORS.TASK}18` }} />
          <span className="text-xs text-slate-500 dark:text-slate-400">업무</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-l-2 flex-shrink-0" style={{ borderColor: AGENDA_TYPE_COLORS.DEADLINE, backgroundColor: `${AGENDA_TYPE_COLORS.DEADLINE}18` }} />
          <span className="text-xs text-slate-500 dark:text-slate-400">마감</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-l-2 flex-shrink-0" style={{ borderColor: AGENDA_TYPE_COLORS.TRIP, backgroundColor: `${AGENDA_TYPE_COLORS.TRIP}18` }} />
          <span className="text-xs text-slate-500 dark:text-slate-400">출장</span>
        </div>
      </div>

      {/* 클릭 시 상세 패널 */}
      {selectedAgenda && (
        <div ref={detailRef}>
          <DetailPanel
            agenda={selectedAgenda}
            onClose={handleCloseDetail}
            onNavigate={handleNavigateDetail}
          />
        </div>
      )}
    </div>
  );
}
