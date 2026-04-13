import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import { useSocket } from '@/contexts/SocketContext';
import type { Notification, ApiResponse } from '@/types';

interface NotificationListResponse {
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchNotifications = useCallback(async (cursor?: string) => {
    setIsLoading(true);
    try {
      const params = cursor ? `?cursor=${cursor}` : '';
      const { data } = await api.get<ApiResponse<NotificationListResponse>>(`/notifications${params}`);
      const result = data.data;

      if (cursor) {
        setNotifications((prev) => [...prev, ...result.items]);
      } else {
        setNotifications(result.items);
      }
      setUnreadCount(result.unreadCount);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      // handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const loadMore = () => {
    if (nextCursor && hasMore) fetchNotifications(nextCursor);
  };

  return { notifications, unreadCount, isLoading, hasMore, loadMore, markAsRead, markAllAsRead, refresh: fetchNotifications };
}
