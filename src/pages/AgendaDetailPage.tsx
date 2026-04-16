import { Link } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAgenda, useToggleComplete, useDeleteAgenda } from '@/hooks/useAgendas';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_BG, PRIORITY_LABELS, PRIORITY_COLORS } from '@/utils/constants';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Button, Badge, Card, EmptyState, SkeletonList } from '@/components/ui';
import { AgendaDetailView, ParticipantList, CommentSection } from '@/components/agenda';
import api from '@/utils/api';
import type { ApiResponse, DeadlineExtensionRequest } from '@/types';

// ── 상태 배지 ─────────────────────────────────────────────────────────────────
function ExtensionStatusBadge({ status }: { status: DeadlineExtensionRequest['status'] }) {
  if (status === 'PENDING') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">검토중</span>;
  if (status === 'APPROVED') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">승인됨</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">거부됨</span>;
}

export default function AgendaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { agenda, isLoading } = useAgenda(id);

  // 완료 토글 (낙관적 업데이트 내장)
  const toggleComplete = useToggleComplete(id!);

  // 삭제 (낙관적 업데이트 내장)
  const deleteAgenda = useDeleteAgenda();

  // ── 연장 신청 상태 ────────────────────────────────────────────────────────────
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [reason, setReason] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const extensionQueryKey = ['agendas', id, 'extension-requests'] as const;

  const { data: extensionRequests = [], refetch: refetchExtensions } = useQuery({
    queryKey: extensionQueryKey,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DeadlineExtensionRequest[]>>(`/agendas/${id}/extension-requests`);
      return data.data;
    },
    enabled: Boolean(id) && Boolean(agenda) && agenda?.category === 'AGENDA' && Boolean(agenda?.deadline),
  });

  const createExtensionRequest = useMutation({
    mutationFn: async (payload: { newDeadline: string; reason?: string }) => {
      const { data } = await api.post<ApiResponse<DeadlineExtensionRequest>>(`/agendas/${id}/extension-requests`, payload);
      return data.data;
    },
    onSuccess: () => {
      toast.success('마감기한 연장 신청이 완료되었습니다.');
      setShowRequestModal(false);
      setNewDeadline('');
      setReason('');
      refetchExtensions();
    },
    onError: () => {
      toast.error('연장 신청에 실패했습니다.');
    },
  });

  const reviewExtensionRequest = useMutation({
    mutationFn: async ({ requestId, action, comment }: { requestId: string; action: 'APPROVE' | 'REJECT'; comment?: string }) => {
      const { data } = await api.patch<ApiResponse<DeadlineExtensionRequest>>(
        `/agendas/${id}/extension-requests/${requestId}`,
        { action, reviewComment: comment }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.action === 'APPROVE' ? '연장 신청을 승인했습니다.' : '연장 신청을 거부했습니다.');
      setReviewingId(null);
      setReviewComment('');
      refetchExtensions();
      queryClient.invalidateQueries({ queryKey: queryKeys.agendas.detail(id!) });
    },
    onError: () => {
      toast.error('처리에 실패했습니다.');
    },
  });

  if (isLoading) {
    return <div className="max-w-3xl mx-auto"><SkeletonList count={3} /></div>;
  }

  if (!agenda) {
    return (
      <div className="max-w-lg mx-auto">
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="아젠다를 찾을 수 없습니다."
          action={
            <Link to="/agendas" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium">
              목록으로 돌아가기
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = agenda.createdBy.id === currentUser?.id;
  const isAdmin = currentUser?.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;

  // 연장 신청 관련 권한
  const myParticipant = agenda.participants.find((p) => p.user.id === currentUser?.id);
  const isOrganizer = myParticipant?.role === 'ORGANIZER';
  const isParticipant = Boolean(myParticipant);
  const canReviewExtension = isOrganizer || isAdmin;
  const canRequestExtension = isParticipant && !isOrganizer && !isAdmin && agenda.category === 'AGENDA' && Boolean(agenda.deadline);
  const showExtensionSection = agenda.category === 'AGENDA' && Boolean(agenda.deadline);
  const pendingExtensions = extensionRequests.filter((r) => r.status === 'PENDING');

  const deadlineDaysLeft = agenda.deadline
    ? Math.ceil((new Date(agenda.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleComplete = () => {
    toggleComplete.mutate(undefined, {
      onSuccess: () => {
        toast.success(agenda.isCompleted ? '미완료로 변경되었습니다.' : '완료 처리되었습니다.');
      },
    });
  };

  const handleDelete = () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    deleteAgenda.mutate(id!, {
      onSuccess: () => {
        toast.success('아젠다가 삭제되었습니다.');
        navigate('/agendas');
      },
    });
  };

  // 댓글 추가/삭제 후 캐시 무효화
  const refreshComments = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.agendas.detail(id!) });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={AGENDA_TYPE_BG[agenda.type]}>{AGENDA_TYPE_LABELS[agenda.type]}</Badge>
            <Badge className={PRIORITY_COLORS[agenda.priority]}>{PRIORITY_LABELS[agenda.priority]}</Badge>
            {agenda.isCompleted && <Badge variant="success">완료</Badge>}
            {agenda.isNotice && <Badge variant="warning">공지</Badge>}
          </div>
          <h1
            className={clsx(
              'text-2xl font-bold',
              agenda.isCompleted
                ? 'line-through text-slate-400'
                : 'text-slate-900 dark:text-white'
            )}
          >
            {agenda.title}
          </h1>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleComplete}
              isLoading={toggleComplete.isPending}
            >
              {agenda.isCompleted ? '미완료' : '완료'}
            </Button>
            <Link to={`/agendas/${id}/edit`}>
              <Button variant="secondary" size="sm">수정</Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteAgenda.isPending}
              className="text-rose-600 hover:text-rose-700"
            >
              삭제
            </Button>
          </div>
        )}
      </div>

      <AgendaDetailView agenda={agenda} deadlineDaysLeft={deadlineDaysLeft} />

      {/* 참여자 */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
          참여자 ({agenda.participants.length})
        </h3>
        <ParticipantList participants={agenda.participants} />
      </Card>

      {/* 첨부파일 */}
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

      {/* 마감기한 연장 신청 섹션 */}
      {showExtensionSection && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              마감기한 연장 신청
            </h3>
            {canRequestExtension && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRequestModal(true)}
              >
                연장 신청
              </Button>
            )}
          </div>

          {/* 주관자/어드민: PENDING 신청 목록 */}
          {canReviewExtension && pendingExtensions.length > 0 && (
            <div className="space-y-3 mb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">검토 대기중</p>
              {pendingExtensions.map((req) => (
                <div key={req.id} className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{req.requestedBy.name}</span>
                        <ExtensionStatusBadge status={req.status} />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        새 마감기한: <span className="font-medium">{new Date(req.newDeadline).toLocaleDateString('ko-KR')}</span>
                      </p>
                      {req.reason && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">사유: {req.reason}</p>
                      )}
                    </div>
                  </div>
                  {reviewingId === req.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        className="w-full text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                        rows={2}
                        placeholder="검토 코멘트 (선택사항)"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => reviewExtensionRequest.mutate({ requestId: req.id, action: 'APPROVE', comment: reviewComment })}
                          isLoading={reviewExtensionRequest.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => reviewExtensionRequest.mutate({ requestId: req.id, action: 'REJECT', comment: reviewComment })}
                          isLoading={reviewExtensionRequest.isPending}
                          className="text-rose-600 hover:text-rose-700"
                        >
                          거부
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setReviewingId(null); setReviewComment(''); }}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2"
                      onClick={() => setReviewingId(req.id)}
                    >
                      검토하기
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 처리된 신청 내역 (주관자: 처리 완료된 것만 / 참여자: 전체) */}
          {(() => {
            const historyItems = canReviewExtension
              ? extensionRequests.filter((r) => r.status !== 'PENDING')
              : extensionRequests;
            if (historyItems.length === 0 && pendingExtensions.length === 0) {
              return <p className="text-xs text-slate-400 dark:text-slate-500">연장 신청 내역이 없습니다.</p>;
            }
            if (historyItems.length === 0) return null;
            return (
              <div className="space-y-2">
                {canReviewExtension && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">처리 완료</p>}
                {historyItems.map((req) => (
                  <div key={req.id} className="flex items-start justify-between gap-2 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{req.requestedBy.name}</span>
                        <ExtensionStatusBadge status={req.status} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        새 마감기한: {new Date(req.newDeadline).toLocaleDateString('ko-KR')}
                      </p>
                      {req.reason && <p className="text-xs text-slate-400 mt-0.5">사유: {req.reason}</p>}
                      {req.reviewComment && <p className="text-xs text-slate-400 mt-0.5">코멘트: {req.reviewComment}</p>}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(req.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>
      )}

      {/* 연장 신청 모달 */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">마감기한 연장 신청</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  새 마감기한 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  사유 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="연장이 필요한 이유를 입력하세요."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowRequestModal(false); setNewDeadline(''); setReason(''); }}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!newDeadline) { toast.error('새 마감기한을 선택하세요.'); return; }
                  createExtensionRequest.mutate({ newDeadline: new Date(newDeadline).toISOString(), reason: reason || undefined });
                }}
                isLoading={createExtensionRequest.isPending}
              >
                신청
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 댓글 */}
      <CommentSection
        agendaId={agenda.id}
        comments={agenda.comments || []}
        currentUserId={currentUser?.id}
        isAdmin={isAdmin}
        onRefresh={refreshComments}
      />
    </div>
  );
}
