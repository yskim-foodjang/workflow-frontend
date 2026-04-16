import { useEffect } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import api from '@/utils/api';
import { useSocket } from '@/contexts/SocketContext';
import type { Notification, ApiResponse } from '@/types';
import { queryKeys } from '@/lib/queryKeys';

// ─── 내부 타입 ────────────────────────────────────────────────────────────────

interface NotificationListResponse {
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}

// ─── 알림 목록 + 실시간 소켓 ────────────────────────────────────────────────────

export function useNotifications() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // 무한 쿼리로 페이지네이션 지원
  const result = useInfiniteQuery<
    NotificationListResponse,
    Error,
    InfiniteData<NotificationListResponse>,
    ReturnType<typeof queryKeys.notifications.lists>,
    string | null
  >({
    queryKey: queryKeys.notifications.lists(),
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      const { data } = await api.get<ApiResponse<NotificationListResponse>>(`/notifications${params}`);
      return data.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    staleTime: 30_000,
  });

  // 실시간 소켓: 새 알림 수신 시 캐시에 prepend
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      queryClient.setQueryData<InfiniteData<NotificationListResponse>>(
        queryKeys.notifications.lists(),
        (old) => {
          if (!old) return old;
          const firstPage = old.pages[0];
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                items: [notification, ...firstPage.items],
                unreadCount: (firstPage.unreadCount ?? 0) + 1,
              },
              ...old.pages.slice(1),
            ],
          };
        }
      );
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, queryClient]);

  // 전체 데이터에서 flatten
  const notifications = result.data?.pages.flatMap((p) => p.items) ?? [];
  // 첫 페이지의 unreadCount가 전체 기준
  const unreadCount = result.data?.pages[0]?.unreadCount ?? 0;
  const notifPages = result.data?.pages ?? [];
  const hasMore = notifPages.length > 0 ? (notifPages[notifPages.length - 1]?.hasMore ?? false) : false;

  // ── 낙관적 읽음 처리 ──────────────────────────────────────────────────────

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.lists() });

      const previous = queryClient.getQueryData<InfiniteData<NotificationListResponse>>(
        queryKeys.notifications.lists()
      );

      queryClient.setQueryData<InfiniteData<NotificationListResponse>>(
        queryKeys.notifications.lists(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, i) => ({
              ...page,
              items: page.items.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
              ),
              // 첫 페이지에서만 unreadCount 감소
              unreadCount: i === 0
                ? Math.max(0, page.unreadCount - 1)
                : page.unreadCount,
            })),
          };
        }
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.lists(), context.previous);
      }
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.lists() });

      const previous = queryClient.getQueryData<InfiniteData<NotificationListResponse>>(
        queryKeys.notifications.lists()
      );

      queryClient.setQueryData<InfiniteData<NotificationListResponse>>(
        queryKeys.notifications.lists(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((n) => ({ ...n, isRead: true })),
              unreadCount: 0,
            })),
          };
        }
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.lists(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading: result.isLoading,
    hasMore,
    loadMore: () => {
      if (hasMore && !result.isFetchingNextPage) result.fetchNextPage();
    },
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    refresh: () => result.refetch(),
  };
}
