import { PageHeader } from '@/components/ui';
import { CalendarView } from '@/components/calendar';

export default function CalendarPage() {
  return (
    <div>
      <PageHeader title="캘린더" />
      <CalendarView />
    </div>
  );
}
