import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';
import { Card, Badge, PageHeader, EmptyState, SkeletonList } from '@/components/ui';

const NOTIFICATION_ICONS: Record<string, string> = {
  PARTICIPANT_ADDED: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  AGENDA_UPDATED: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  DEADLINE_REMINDER: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  COMMENT_ADDED: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  MENTION: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207',
};

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, hasMore, loadMore, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (notification: typeof notifications[0]) => {
    if (!notification.isRead) markAsRead(notification.id);
    if (notification.agendaId) navigate(`/agendas/${notification.agendaId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="알림"
        badge={unreadCount > 0 ? <Badge variant="danger">{unreadCount}개 읽지 않음</Badge> : undefined}
        actions={
          unreadCount > 0 ? (
            <button onClick={markAllAsRead} className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
              모두 읽음
            </button>
          ) : undefined
        }
      />

      {isLoading && notifications.length === 0 ? (
        <SkeletonList count={5} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
          title="알림이 없습니다."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className="w-full text-left"
            >
              <Card padding="sm" className={clsx(
                'flex gap-3 hover:shadow-md transition-shadow',
                !notification.isRead && 'border-l-4 border-l-primary-500'
              )}>
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  notification.isRead
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    : 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                )}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.AGENDA_UPDATED} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    'text-sm',
                    notification.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white font-medium'
                  )}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {format(new Date(notification.createdAt), 'M/d (EEE) HH:mm', { locale: ko })}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                )}
              </Card>
            </button>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-3 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              더 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
