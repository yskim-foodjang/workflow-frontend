import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/utils/api';
import { useAgenda } from '@/hooks/useAgendas';
import { AGENDA_TYPE_LABELS, PRIORITY_LABELS, RECURRENCE_LABELS, CATEGORY_LABELS } from '@/utils/constants';
import type { ApiResponse, Agenda, User, RecurrenceConfig, AgendaCategory } from '@/types';
import toast from 'react-hot-toast';
import { Button, Card, PageHeader, FileUpload } from '@/components/ui';
import type { UploadedFile } from '@/components/ui';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import { TagInput, ParticipantPicker } from '@/components/agenda';

interface FormData {
  category: AgendaCategory;
  title: string;
  type: string;
  description: string;
  startAt: string;
  endAt: string;
  deadline: string;
  recurrence: RecurrenceConfig;
  priority: string;
  visibility: string;
  location: string;
  onlineLink: string;
  reportMethod: string;
  isNotice: boolean;
  tags: string[];
  participantIds: string[];
}

const emptyForm: FormData = {
  category: 'SCHEDULE', title: '', type: 'OTHER', description: '', startAt: '', endAt: '', deadline: '',
  recurrence: { type: 'NONE' }, priority: 'NORMAL', visibility: 'PRIVATE',
  location: '', onlineLink: '', reportMethod: '', isNotice: false, tags: [], participantIds: [],
};

function toLocalDatetime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AgendaFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { agenda } = useAgenda(isEdit ? id : undefined);

  const [form, setForm] = useState<FormData>(emptyForm);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (agenda && isEdit) {
      setForm({
        category: agenda.category,
        title: agenda.title, type: agenda.type,
        description: agenda.description || '',
        startAt: toLocalDatetime(agenda.startAt), endAt: agenda.endAt ? toLocalDatetime(agenda.endAt) : '',
        deadline: agenda.deadline ? toLocalDatetime(agenda.deadline) : '',
        recurrence: agenda.recurrence,
        priority: agenda.priority, visibility: agenda.visibility,
        location: agenda.location || '', onlineLink: agenda.onlineLink || '',
        reportMethod: agenda.reportMethod || '',
        isNotice: agenda.isNotice, tags: agenda.tags,
        participantIds: agenda.participants.map((p) => p.user.id),
      });
      setSelectedUsers(agenda.participants.map((p) => p.user));
    }
  }, [agenda, isEdit]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddParticipant = (user: User) => {
    if (!form.participantIds.includes(user.id)) {
      updateField('participantIds', [...form.participantIds, user.id]);
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleRemoveParticipant = (userId: string) => {
    updateField('participantIds', form.participantIds.filter((i) => i !== userId));
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('제목을 입력하세요.'); return; }
    if (!form.startAt) { toast.error('시작 시간을 입력하세요.'); return; }
    if (form.category === 'SCHEDULE' && !form.endAt) { toast.error('종료 시간을 입력하세요.'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        visibility: 'PRIVATE',
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        description: form.description || undefined,
        location: form.location || undefined,
        onlineLink: form.onlineLink || undefined,
        reportMethod: form.reportMethod || undefined,
      };
      let agendaId: string;
      if (isEdit) {
        await api.put<ApiResponse<Agenda>>(`/agendas/${id}`, payload);
        agendaId = id!;
      } else {
        const { data } = await api.post<ApiResponse<Agenda>>('/agendas', payload);
        agendaId = data.data.id;
      }

      // Upload pending files (errors handled separately)
      const pendingFiles = uploadFiles.filter((f) => f.status === 'pending');
      let uploadFailed = false;
      for (const uf of pendingFiles) {
        try {
          const formData = new FormData();
          formData.append('file', uf.file);
          await api.post(`/agendas/${agendaId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadErr) {
          console.error('첨부파일 업로드 실패:', uploadErr);
          uploadFailed = true;
        }
      }

      if (uploadFailed) {
        toast.error('일정은 저장됐지만 일부 첨부파일 업로드에 실패했습니다.');
      } else {
        toast.success(isEdit ? '수정되었습니다.' : '일정이 생성되었습니다.');
      }
      navigate(`/agendas/${agendaId}`);
    } catch (err) {
      console.error('저장 실패:', err);
      toast.error(isEdit ? '수정에 실패했습니다.' : '생성에 실패했습니다.');
    }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={isEdit ? `${CATEGORY_LABELS[form.category]} 수정` : '새 일정'} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Toggle */}
        {!isEdit && (
          <div className="flex gap-2">
            {(Object.entries(CATEGORY_LABELS) as [AgendaCategory, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateField('category', key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  form.category === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <Card>
          <div className="space-y-5">
            <FormField label="제목" required>
              <Input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder={`${CATEGORY_LABELS[form.category]} 제목`} autoFocus />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="유형">
                <Select value={form.type} onChange={(e) => updateField('type', e.target.value)}>
                  {Object.entries(AGENDA_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </FormField>
              <FormField label="우선순위">
                <Select value={form.priority} onChange={(e) => updateField('priority', e.target.value)}>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="시작" required>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => updateField('startAt', e.target.value)} />
              </FormField>
              {form.category === 'AGENDA' ? (
                <FormField label="마감기한">
                  <Input type="datetime-local" value={form.deadline} onChange={(e) => updateField('deadline', e.target.value)} />
                </FormField>
              ) : (
                <FormField label="종료" required>
                  <Input type="datetime-local" value={form.endAt} onChange={(e) => updateField('endAt', e.target.value)} />
                </FormField>
              )}
            </div>

            {form.category === 'SCHEDULE' && (
              <FormField label="반복">
                <Select value={form.recurrence.type} onChange={(e) => updateField('recurrence', { ...form.recurrence, type: e.target.value as RecurrenceConfig['type'] })}>
                  {Object.entries(RECURRENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </FormField>
            )}

            <div className="grid grid-cols-2 gap-4">
              {form.category === 'AGENDA' ? (
                <FormField label="보고방식">
                  <Input value={form.reportMethod} onChange={(e) => updateField('reportMethod', e.target.value)} placeholder="보고 방법 및 절차" />
                </FormField>
              ) : (
                <FormField label="장소">
                  <Input value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="회의실 / 장소" />
                </FormField>
              )}
              <FormField label="온라인 링크">
                <Input type="url" value={form.onlineLink} onChange={(e) => updateField('onlineLink', e.target.value)} placeholder="https://zoom.us/..." />
              </FormField>
            </div>

            <FormField label="참여자">
              <ParticipantPicker
                selectedUsers={selectedUsers}
                participantIds={form.participantIds}
                onAdd={handleAddParticipant}
                onRemove={handleRemoveParticipant}
              />
            </FormField>

            <FormField label="설명 / 메모">
              <Textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="마크다운 지원" />
            </FormField>
          </div>
        </Card>

        {/* Tags */}
        <Card>
          <FormField label="태그">
            <TagInput tags={form.tags} onChange={(tags) => updateField('tags', tags)} />
          </FormField>
        </Card>

        {/* Attachments */}
        <Card>
          <FormField label="첨부파일">
            <FileUpload files={uploadFiles} onChange={setUploadFiles} />
          </FormField>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>취소</Button>
          <Button type="submit" isLoading={isSubmitting}>{isEdit ? '수정' : '생성'}</Button>
        </div>
      </form>
    </div>
  );
}
