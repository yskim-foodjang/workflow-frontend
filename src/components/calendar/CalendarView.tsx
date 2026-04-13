import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg, DatesSetArg } from '@fullcalendar/core';
import api from '@/utils/api';
import { AGENDA_TYPE_COLORS } from '@/utils/constants';
import { BRAND_COLOR, BRAND_PALETTE } from '@/config/app';
import { Card } from '@/components/ui';
import type { Agenda, ApiResponse } from '@/types';

export default function CalendarView() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventInput[]>([]);

  const fetchEvents = useCallback(async (start: string, end: string) => {
    try {
      const { data } = await api.get<ApiResponse<Agenda[]>>(`/agendas/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
      const mapped: EventInput[] = data.data.map((agenda) => ({
        id: agenda.id,
        title: agenda.title,
        start: agenda.startAt,
        ...(agenda.endAt ? { end: agenda.endAt } : {}),
        backgroundColor: AGENDA_TYPE_COLORS[agenda.type] || BRAND_COLOR,
        borderColor: AGENDA_TYPE_COLORS[agenda.type] || BRAND_COLOR,
        extendedProps: { agenda },
      }));
      setEvents(mapped);
    } catch {
      // handled by interceptor
    }
  }, []);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    fetchEvents(arg.startStr, arg.endStr);
  }, [fetchEvents]);

  const handleSelect = useCallback((selectInfo: DateSelectArg) => {
    const start = selectInfo.startStr;
    const end = selectInfo.endStr;
    navigate(`/agendas/new?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  }, [navigate]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    navigate(`/agendas/${clickInfo.event.id}`);
  }, [navigate]);

  return (
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
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 12px;
          cursor: pointer;
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
      `}</style>
    </Card>
  );
}
