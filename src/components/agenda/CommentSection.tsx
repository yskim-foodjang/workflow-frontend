import { useState } from 'react';
import { format } from 'date-fns';
import api from '@/utils/api';
import { Button, Avatar, Card } from '@/components/ui';
import { Input } from '@/components/ui/FormField';
import toast from 'react-hot-toast';
import type { Comment, ApiResponse } from '@/types';

interface CommentSectionProps {
  agendaId: string;
  comments: Comment[];
  currentUserId: string | undefined;
  isAdmin: boolean;
  onRefresh: () => void;
}

export default function CommentSection({ agendaId, comments, currentUserId, isAdmin, onRefresh }: CommentSectionProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post<ApiResponse<Comment>>(`/agendas/${agendaId}/comments`, { content: comment });
      setComment('');
      onRefresh();
    } catch {
      toast.error('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.delete(`/agendas/${agendaId}/comments/${commentId}`);
      onRefresh();
    } catch {
      toast.error('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <Card>
      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
        댓글 ({comments.length})
      </h3>

      {comments.length > 0 && (
        <div className="space-y-4 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar name={c.user.name} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{c.user.name}</span>
                  <span className="text-xs text-slate-400">{format(new Date(c.createdAt), 'M/d HH:mm')}</span>
                  {(c.user.id === currentUserId || isAdmin) && (
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-slate-400 hover:text-rose-500">삭제</button>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
            placeholder="댓글을 입력하세요..."
          />
        </div>
        <Button onClick={handleAdd} disabled={!comment.trim()} isLoading={isSubmitting}>
          작성
        </Button>
      </div>
    </Card>
  );
}
