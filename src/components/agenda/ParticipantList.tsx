import { PARTICIPANT_ROLE_LABELS } from '@/utils/constants';
import { Avatar, Badge } from '@/components/ui';
import type { AgendaParticipant } from '@/types';

interface ParticipantListProps {
  participants: AgendaParticipant[];
}

export default function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <div className="space-y-2">
      {participants.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <Avatar name={p.user.name} />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{p.user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.user.department?.name} · {p.user.position}</p>
          </div>
          <Badge>{PARTICIPANT_ROLE_LABELS[p.role]}</Badge>
        </div>
      ))}
    </div>
  );
}
