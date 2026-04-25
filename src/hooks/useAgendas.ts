import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type InfiniteData,
} from '@tanstack/react-query';
import api from '@/utils/api';
import type { Agenda, ApiResponse } from '@/types';
import { queryKeys, type AgendaListFilters } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

// ─── 내부 타입 ────────────────────────────────────────────────────────────────

interface AgendaListResponse {
  items: Agenda[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function buildParams(options: AgendaListFilters, cursor?: string | null): string {
  const params = new URLSearchParams();
  if (options.search)     params.set('search', options.search);
  if (options.category)   params.set('category', options.category);
  if (options.type)       params.set('type', options.type);
  if (options.priority)   params.set('priority', options.priority);
  if (options.visibility) params.set('visibility', options.visibility);
  if (options.completed)  params.set('completed', options.completed);
  if (options.limit)      params.set('limit', String(options.limit));
  if (cursor)             params.set('cursor', cursor);
  return params.toString();
}

// ─── 목록 조회 (무한 스크롤 + 캐싱) ─────────────────────────────────────────

export function useAgendas(options: AgendaListFilters = {}) {
  const result = useInfiniteQuery<
    AgendaListResponse,
    Error,
    InfiniteData<AgendaListResponse>,
    ReturnType<typeof queryKeys.agendas.list>,
    string | null
  >({
    queryKey: queryKeys.agendas.list(options),
    queryFn: async ({ pageParam }) => {
      const qs = buildParams(options, pageParam);
      const { data } = await api.get<ApiResponse<AgendaListResponse>>(`/agendas?${qs}`);
      return data.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    staleTime: 5 * 60_000,   // 5분: 페이지 이동/재방문 시 즉시 표시
    // 필터 바꿀 때 기존 데이터 유지 → 깜빡임(blank) 완전 제거
    placeholderData: keepPreviousData,
  });

  const agendas = result.data?.pages.flatMap((p) => p.items) ?? [];
  const pages = result.data?.pages ?? [];
  const hasMore = pages.length > 0 ? (pages[pages.length - 1]?.hasMore ?? false) : false;

  return {
    agendas,
    isLoading: result.isLoading,
    isFetchingMore: result.isFetchingNextPage,
    hasMore,
    loadMore: () => {
      if (hasMore && !result.isFetchingNextPage) result.fetchNextPage();
    },
    refresh: () => result.refetch(),
  };
}

// ─── 단건 조회 ────────────────────────────────────────────────────────────────

export function useAgenda(id: string | undefined) {
  const result = useQuery({
    queryKey: id ? queryKeys.agendas.detail(id) : ['agendas', '__none__'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Agenda>>(`/agendas/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60_000,   // 5분
  });

  return {
    agenda: result.data ?? null,
    isLoading: result.isLoading,
    refresh: () => result.refetch(),
  };
}

// ─── 생성 ─────────────────────────────────────────────────────────────────────

export function useCreateAgenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post<ApiResponse<Agenda>>('/agendas', payload);
      return data.data;
    },
    onSuccess: () => {
      // agendas.all 전체 무효화 → 목록 + 대시보드 모두 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.agendas.all });
    },
  });
}

// ─── 수정 ─────────────────────────────────────────────────────────────────────

export function useUpdateAgenda(id: string, scope?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const url = scope ? `/agendas/${id}?scope=${scope}` : `/agendas/${id}`;
      const { data } = await api.put<ApiResponse<Agenda>>(url, payload);
      return data.data;
    },
    onSuccess: (updated) => {
      // 상세 캐시 즉시 업데이트 (재요청 불필요)
      queryClient.setQueryData<Agenda>(queryKeys.agendas.detail(id), updated);
      // 목록 + 대시보드 모두 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.agendas.all });
    },
  });
}

// ─── 삭제 (낙관적 업데이트) ───────────────────────────────────────────────────

export function useDeleteAgenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/agendas/${id}`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.agendas.lists() });

      const previousLists = queryClient.getQueriesData<InfiniteData<AgendaListResponse>>({
        queryKey: queryKeys.agendas.lists(),
      });

      // 낙관적으로 목록에서 즉시 제거
      queryClient.setQueriesData<InfiniteData<AgendaListResponse>>(
        { queryKey: queryKeys.agendas.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((a) => a.id !== id),
            })),
          };
        }
      );

      return { previousLists };
    },
    onError: (_err, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error('삭제에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendas.all });
    },
  });
}

// ─── 완료 토글 (낙관적 업데이트) ─────────────────────────────────────────────

export function useToggleComplete(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.patch(`/agendas/${id}/complete`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.agendas.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.agendas.lists() });

      const previousDetail = queryClient.getQueryData<Agenda>(
        queryKeys.agendas.detail(id)
      );
      const previousLists = queryClient.getQueriesData<InfiniteData<AgendaListResponse>>({
        queryKey: queryKeys.agendas.lists(),
      });

      // 상세 페이지 낙관적 업데이트
      if (previousDetail) {
        queryClient.setQueryData<Agenda>(queryKeys.agendas.detail(id), {
          ...previousDetail,
          isCompleted: !previousDetail.isCompleted,
        });
      }

      // 목록 낙관적 업데이트
      queryClient.setQueriesData<InfiniteData<AgendaListResponse>>(
        { queryKey: queryKeys.agendas.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((a) =>
                a.id === id ? { ...a, isCompleted: !a.isCompleted } : a
              ),
            })),
          };
        }
      );

      return { previousDetail, previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.agendas.detail(id), context.previousDetail);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error('상태 변경에 실패했습니다.');
    },
    onSettled: () => {
      // detail + lists + dashboard 모두 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.agendas.all });
    },
  });
}
