export const CATEGORY_LABELS: Record<string, string> = {
  AGENDA: '아젠다',
  SCHEDULE: '일정',
};

export const CATEGORY_BG: Record<string, string> = {
  AGENDA: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  SCHEDULE: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

export const AGENDA_TYPE_LABELS: Record<string, string> = {
  MEETING: '회의',
  TASK: '업무',
  DEADLINE: '마감',
  TRIP: '출장',
  OTHER: '기타',
};

export const AGENDA_TYPE_COLORS: Record<string, string> = {
  MEETING: '#3B82F6',
  TASK: '#10B981',
  DEADLINE: '#F43F5E',
  TRIP: '#F59E0B',
  OTHER: '#8B5CF6',
};

export const AGENDA_TYPE_BG: Record<string, string> = {
  MEETING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TASK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  DEADLINE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  TRIP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OTHER: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: '낮음',
  NORMAL: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  URGENT: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export const VISIBILITY_LABELS: Record<string, string> = {
  PRIVATE: '나만',
  TEAM: '팀',
  DEPARTMENT: '부서',
  PUBLIC: '전사',
};

export const RECURRENCE_LABELS: Record<string, string> = {
  NONE: '없음',
  DAILY: '매일',
  WEEKLY: '매주',
  MONTHLY: '매월',
  CUSTOM: '사용자 지정',
};

export const PARTICIPANT_ROLE_LABELS: Record<string, string> = {
  ORGANIZER: '주관',
  PARTICIPANT: '참여',
  REVIEWER: '검토',
  OBSERVER: '참조',
};
