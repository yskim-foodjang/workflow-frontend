/**
 * Centralized query key factory.
 * All React Query keys are defined here so cache invalidation is consistent.
 */

export interface AgendaListFilters {
  search?: string;
  category?: string;
  type?: string;
  priority?: string;
  visibility?: string;
  completed?: string;
  limit?: number;
}

export const queryKeys = {
  agendas: {
    all: ['agendas'] as const,
    dashboard: () => [...queryKeys.agendas.all, 'dashboard'] as const,
    lists: () => [...queryKeys.agendas.all, 'list'] as const,
    list: (filters: AgendaListFilters) =>
      [...queryKeys.agendas.lists(), filters] as const,
    details: () => [...queryKeys.agendas.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agendas.details(), id] as const,
    calendar: (start: string, end: string) =>
      [...queryKeys.agendas.all, 'calendar', start, end] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
  },
} as const;
