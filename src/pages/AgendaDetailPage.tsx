import { Link } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgenda } from '@/hooks/useAgendas';
import { useAuth } from '@/contexts/AuthContext';
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_BG, PRIORITY_LABELS, PRIORITY_COLORS } from '@/utils/constants';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Button, Badge, Card, EmptyState, SkeletonList } from '@/components/ui';
import { AgendaDetailView, ParticipantList, CommentSection } from '@/components/agenda';

export default function AgendaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { agenda, isLoading, refresh } = useAgenda(id);

  if (isLoading) {
    return <div className="max-w-3xl mx-auto"><SkeletonList count={3} /></div>;
  }

  if (!agenda) {
    return (
      <div className="max-w-lg mx-auto">
        <EmptyState
          icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          title="아젠다를 찾을 수 없습니다."
          action={<Link to="/agendas" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium">목록으로 돌아가기</Link>}
        />
      </div>
    );
  }

  const isOwner = agenda.createdBy.id === currentUser?.id;
  const isAdmin = currentUser?.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;

  const deadlineDaysLeft = agenda.deadline
    ? Math.ceil((new Date(agenda.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleComplete = async () => {
    try {
      await api.patch(`/agendas/${id}/complete`);
      toast.success(agenda.isCompleted ? '미완료로 변경되었습니다.' : '완료 처리되었습니다.');
      refresh();
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/agendas/${id}`);
      toast.success('아젠다가 삭제되었습니다.');
      navigate('/agendas');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={AGENDA_TYPE_BG[agenda.type]}>{AGENDA_TYPE_LABELS[agenda.type]}</Badge>
            <Badge className={PRIORITY_COLORS[agenda.priority]}>{PRIORITY_LABELS[agenda.priority]}</Badge>
            {agenda.isCompleted && <Badge variant="success">완료</Badge>}
            {agenda.isNotice && <Badge variant="warning">공지</Badge>}
          </div>
          <h1 className={clsx('text-2xl font-bold', agenda.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white')}>
            {agenda.title}
          </h1>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleComplete}>
              {agenda.isCompleted ? '미완료' : '완료'}
            </Button>
            <Link to={`/agendas/${id}/edit`}>
              <Button variant="secondary" size="sm">수정</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={handleDelete} className="text-rose-600 hover:text-rose-700">삭제</Button>
          </div>
        )}
      </div>

      <AgendaDetailView agenda={agenda} deadlineDaysLeft={deadlineDaysLeft} />

      {/* Participants */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
          참여자 ({agenda.participants.length})
        </h3>
        <ParticipantList participants={agenda.participants} />
      </Card>

      {/* Attachments */}
      {agenda.attachments.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
            첨부파일 ({agenda.attachments.length})
          </h3>
          <div className="space-y-2">
            {agenda.attachments.map((att) => {
              const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(att.filename);
              return (
                <div key={att.id} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {isImage && (
                    <a href={att.bucketPath} target="_blank" rel="noopener noreferrer">
                      <img
                        src={att.bucketPath}
                        alt={att.filename}
                        className="w-full max-h-64 object-contain bg-slate-50 dark:bg-slate-800"
                      />
                    </a>
                  )}
                  <div className="flex items-center gap-3 px-3 py-2">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <a
                      href={att.bucketPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline truncate flex-1"
                    >
                      {att.filename}
                    </a>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {att.size < 1024 * 1024
                        ? `${(att.size / 1024).toFixed(1)} KB`
                        : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Comments */}
      <CommentSection
        agendaId={agenda.id}
        comments={agenda.comments || []}
        currentUserId={currentUser?.id}
        isAdmin={isAdmin}
        onRefresh={refresh}
      />
    </div>
  );
}
