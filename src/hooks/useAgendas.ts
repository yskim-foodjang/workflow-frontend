import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import type { Agenda, ApiResponse } from '@/types';

interface AgendaListResponse {
  items: Agenda[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface UseAgendasOptions {
  search?: string;
  category?: string;
  type?: string;
  priority?: string;
  visibility?: string;
  completed?: string;
  limit?: number;
}

export function useAgendas(options: UseAgendasOptions = {}) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchAgendas = useCallback(async (cursor?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (options.search) params.set('search', options.search);
      if (options.category) params.set('category', options.category);
      if (options.type) params.set('type', options.type);
      if (options.priority) params.set('priority', options.priority);
      if (options.visibility) params.set('visibility', options.visibility);
      if (options.completed) params.set('completed', options.completed);
      if (options.limit) params.set('limit', String(options.limit));
      if (cursor) params.set('cursor', cursor);

      const { data } = await api.get<ApiResponse<AgendaListResponse>>(`/agendas?${params}`);
      const result = data.data;

      if (cursor) {
        setAgendas((prev) => [...prev, ...result.items]);
      } else {
        setAgendas(result.items);
      }
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, [options.search, options.category, options.type, options.priority, options.visibility, options.completed, options.limit]);

  useEffect(() => {
    fetchAgendas();
  }, [fetchAgendas]);

  const loadMore = () => {
    if (nextCursor && hasMore) {
      fetchAgendas(nextCursor);
    }
  };

  const refresh = () => fetchAgendas();

  return { agendas, isLoading, hasMore, loadMore, refresh };
}

export function useAgenda(id: string | undefined) {
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgenda = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Agenda>>(`/agendas/${id}`);
      setAgenda(data.data);
    } catch {
      setAgenda(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  return { agenda, isLoading, refresh: fetchAgenda };
}
