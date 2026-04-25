import { Link } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAgenda, useToggleComplete, useDeleteAgenda } from '@/hooks/useAgendas';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_BG } from '@/utils/constants';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Button, Badge, CalendarPicker, Card, EmptyState, SkeletonList } from '@/components/ui';
import { AgendaDetailView, CommentSection } from '@/components/agenda';
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
  const [deadlineAmPm, setDeadlineAmPm] = useState<'AM' | 'PM'>('AM');
  const [reason, setReason] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  // ── 주관자 직접 변경 상태 ────────────────────────────────────────────────────
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [orgDeadline, setOrgDeadline] = useState('');
  const [orgAmPm, setOrgAmPm] = useState<'AM' | 'PM'>('AM');
  // ── 반복 스케줄 범위 선택 다이얼로그 ──────────────────────────────────────────
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [recurringDialogMode, setRecurringDialogMode] = useState<'edit' | 'delete'>('edit');

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
      setDeadlineAmPm('AM');
      setReason('');
      refetchExtensions();
    },
    onError: () => {
      toast.error('연장 신청에 실패했습니다.');
    },
  });

  const updateDeadlineByOrganizer = useMutation({
    mutationFn: async (deadline: string) => {
      const { data } = await api.put<ApiResponse<unknown>>(`/agendas/${id}`, { deadline });
      return data.data;
    },
    onSuccess: () => {
      toast.success('마감기한이 변경되었습니다.');
      setShowOrganizerModal(false);
      setOrgDeadline('');
      setOrgAmPm('AM');
      queryClient.invalidateQueries({ queryKey: queryKeys.agendas.all });
    },
    onError: () => {
      toast.error('마감기한 변경에 실패했습니다.');
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

  const canToggleComplete = agenda.category === 'SCHEDULE'
    ? (isParticipant || canEdit)
    : (isOrganizer || isAdmin);
  const canReviewExtension = isOrganizer || isAdmin;
  const canRequestExtension = isParticipant && !isOrganizer && !isAdmin && agenda.category === 'AGENDA' && Boolean(agenda.deadline);
  const canChangeDeadline = (isOrganizer || isAdmin) && agenda.category === 'AGENDA';
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

  // 반복 스케줄 여부 체크
  const isRecurringInstance = Boolean(agenda?.recurrenceParentId);
  const isRecurringParent = !isRecurringInstance && agenda?.category === 'SCHEDULE' && agenda?.recurrence?.type !== 'NONE';
  const isRecurring = isRecurringInstance || isRecurringParent;

  // 진행 중 여부 체크 (스케줄 전용)
  const isInProgress = agenda?.category === 'SCHEDULE' && !agenda?.isCompleted && (() => {
    const now = new Date();
    const start = new Date(agenda!.startAt);
    const end = agenda!.endAt ? new Date(agenda!.endAt) : null;
    return start <= now && end !== null && end > now;
  })();

  const handleDelete = () => {
    if (isRecurring) {
      setRecurringDialogMode('delete');
      setShowRecurringDialog(true);
      return;
    }
    if (!confirm('정말 삭제하시겠습니까?')) return;
    deleteAgenda.mutate(id!, {
      onSuccess: () => {
        toast.success('일정이 삭제되었습니다.');
        navigate('/agendas');
      },
    });
  };

  const handleRecurringAction = async (scope: 'THIS' | 'FOLLOWING' | 'ALL') => {
    setShowRecurringDialog(false);
    const parentId = agenda?.recurrenceParentId;

    if (recurringDialogMode === 'edit') {
      if (scope === 'ALL') {
        // 인스턴스면 부모 ID로, 부모면 자기 자신으로
        const targetId = parentId || id;
        navigate(`/agendas/${targetId}/edit?scope=ALL`);
      } else if (scope === 'FOLLOWING') {
        navigate(`/agendas/${id}/edit?scope=FOLLOWING`);
      } else {
        navigate(`/agendas/${id}/edit`);
      }
      return;
    }

    // delete
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const url = scope === 'ALL'
      ? `/agendas/${id}?scope=ALL`
      : scope === 'FOLLOWING'
        ? `/agendas/${id}?scope=FOLLOWING`
        : `/agendas/${id}`;

    try {
      await api.delete(url);
      toast.success('일정이 삭제되었습니다.');
      navigate('/agendas');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  // ── 읽음 확인 ────────────────────────────────────────────────────────────────
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<ApiResponse<{ confirmedAt: string }>>(`/agendas/${id}/confirm`);
      return data.data;
    },
    onSuccess: () => {
      toast.success('확인했습니다.');
      queryClient.invalidateQueries({ queryKey: queryKeys.agendas.detail(id!) });
    },
    onError: () => {
      toast.error('확인 처리에 실패했습니다.');
    },
  });

  // 현재 로그인 사용자의 확인 여부
  const myConfirmedAt = myParticipant?.confirmedAt ?? null;
  // 주관자가 아닌 참여자이면서 아직 확인 안 한 경우만 버튼 노출
  const canConfirm = Boolean(myParticipant) && myParticipant?.role !== 'ORGANIZER' && !myConfirmedAt;

  // 확인 현황 통계 (주관자 제외)
  const nonOrganizerParticipants = agenda?.participants.filter((p) => p.role !== 'ORGANIZER') ?? [];
  const confirmedCount = nonOrganizerParticipants.filter((p) => p.confirmedAt).length;

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
            {agenda.category === 'SCHEDULE' && (
              <Badge className={AGENDA_TYPE_BG[agenda.type]}>{AGENDA_TYPE_LABELS[agenda.type]}</Badge>
            )}
            {agenda.isCompleted && <Badge variant="success">완료</Badge>}
            {agenda.isNotice && <Badge variant="warning">공지</Badge>}
            {isInProgress && (
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">진행 중</Badge>
            )}
            {isRecurring && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                반복
              </span>
            )}
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
        <div className="flex gap-2 flex-shrink-0">
          {canToggleComplete && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleComplete}
              isLoading={toggleComplete.isPending}
            >
              {agenda.isCompleted ? '미완료' : '완료'}
            </Button>
          )}
          {canEdit && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (isRecurring) {
                    setRecurringDialogMode('edit');
                    setShowRecurringDialog(true);
                  } else {
                    navigate(`/agendas/${id}/edit`);
                  }
                }}
              >
                수정
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDelete}
                isLoading={deleteAgenda.isPending}
                className="text-rose-600 hover:text-rose-700"
              >
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      <AgendaDetailView agenda={agenda} deadlineDaysLeft={deadlineDaysLeft} />

      {/* 참여자 & 확인 현황 */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              참여자 ({agenda.participants.length})
            </h3>
            {/* 비주관자가 있을 때만 확인 현황 표시 */}
            {nonOrganizerParticipants.length > 0 && (
              <span className={clsx(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                confirmedCount === nonOrganizerParticipants.length
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              )}>
                {confirmedCount}/{nonOrganizerParticipants.length} 확인
              </span>
            )}
          </div>
          {/* 내 확인 버튼 */}
          {canConfirm && (
            <Button
              size="sm"
              onClick={() => confirmMutation.mutate()}
              isLoading={confirmMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              ✓ 확인했습니다
            </Button>
          )}
        </div>

        {/* 참여자 목록 + 확인 상태 */}
        <div className="space-y-2">
          {agenda.participants.map((p) => {
            const isOrganizer = p.role === 'ORGANIZER';
            const confirmed = p.confirmedAt;
            return (
              <div key={p.user.id} className="flex items-center justify-between gap-2">
                {/* 아바타 + 이름 + 역할 */}
                <div className="flex items-center gap-2 min-w-0">
                  {p.user.profileImage ? (
                    <img src={p.user.profileImage} alt={p.user.name}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
                        {p.user.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate block">
                      {p.user.name}
                    </span>
                    {p.user.position && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 truncate block">
                        {p.user.position}
                      </span>
                    )}
                  </div>
                  {isOrganizer && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 font-medium flex-shrink-0">
                      주관자
                    </span>
                  )}
                </div>

                {/* 확인 상태 (주관자 제외) */}
                {!isOrganizer && (
                  confirmed ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {format(new Date(confirmed), 'M/d HH:mm', { locale: ko })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">미확인</span>
                  )
                )}
              </div>
            );
          })}
        </div>
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
            <div className="flex gap-2">
              {canChangeDeadline && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowOrganizerModal(true)}
                >
                  마감기한 변경
                </Button>
              )}
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
                <CalendarPicker value={newDeadline} onChange={setNewDeadline} placeholder="날짜 선택" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['AM', 'PM'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDeadlineAmPm(v)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        deadlineAmPm === v
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {v === 'AM' ? '오전' : '오후'}
                    </button>
                  ))}
                </div>
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
                onClick={() => { setShowRequestModal(false); setNewDeadline(''); setDeadlineAmPm('AM'); setReason(''); }}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!newDeadline) { toast.error('새 마감기한을 선택하세요.'); return; }
                  const h = deadlineAmPm === 'AM' ? 12 : 18;
                  const isoDeadline = new Date(`${newDeadline}T${String(h).padStart(2, '0')}:00:00`).toISOString();
                  createExtensionRequest.mutate({ newDeadline: isoDeadline, reason: reason || undefined });
                }}
                isLoading={createExtensionRequest.isPending}
              >
                신청
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 주관자 마감기한 직접 변경 모달 */}
      {showOrganizerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">마감기한 변경</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  새 마감기한 <span className="text-rose-500">*</span>
                </label>
                <CalendarPicker value={orgDeadline} onChange={setOrgDeadline} placeholder="날짜 선택" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['AM', 'PM'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setOrgAmPm(v)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        orgAmPm === v
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {v === 'AM' ? '오전' : '오후'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" size="sm" onClick={() => { setShowOrganizerModal(false); setOrgDeadline(''); setOrgAmPm('AM'); }}>
                취소
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!orgDeadline) { toast.error('새 마감기한을 선택하세요.'); return; }
                  const h = orgAmPm === 'AM' ? 12 : 18;
                  const iso = new Date(`${orgDeadline}T${String(h).padStart(2, '0')}:00:00`).toISOString();
                  updateDeadlineByOrganizer.mutate(iso);
                }}
                isLoading={updateDeadlineByOrganizer.isPending}
              >
                변경
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

      {/* 반복 스케줄 범위 선택 다이얼로그 */}
      {showRecurringDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              반복 일정 {recurringDialogMode === 'edit' ? '수정' : '삭제'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              어느 범위의 일정을 {recurringDialogMode === 'edit' ? '수정' : '삭제'}할까요?
            </p>

            <div className="space-y-2 mb-5">
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                onClick={() => handleRecurringAction('THIS')}
              >
                <div className="font-medium text-slate-900 dark:text-white text-sm">이번 일정만</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">선택한 일정 한 건만 {recurringDialogMode === 'edit' ? '수정' : '삭제'}합니다.</div>
              </button>
              {isRecurringInstance && (
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                  onClick={() => handleRecurringAction('FOLLOWING')}
                >
                  <div className="font-medium text-slate-900 dark:text-white text-sm">이번 이후 모든 일정</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">이 일정 및 이후 반복 일정을 모두 {recurringDialogMode === 'edit' ? '수정' : '삭제'}합니다.</div>
                </button>
              )}
              <button
                type="button"
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  recurringDialogMode === 'delete'
                    ? 'border-rose-200 dark:border-rose-800 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                }`}
                onClick={() => handleRecurringAction('ALL')}
              >
                <div className={`font-medium text-sm ${recurringDialogMode === 'delete' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  모든 반복 일정
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">이 반복 일정의 모든 항목을 {recurringDialogMode === 'edit' ? '수정' : '삭제'}합니다.</div>
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setShowRecurringDialog(false)}
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
