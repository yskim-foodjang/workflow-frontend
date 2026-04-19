import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '@/utils/api';
import { useAgenda, useCreateAgenda, useUpdateAgenda } from '@/hooks/useAgendas';
import { AGENDA_TYPE_LABELS, RECURRENCE_LABELS, CATEGORY_LABELS } from '@/utils/constants';
import type { User, RecurrenceConfig, AgendaCategory } from '@/types';
import toast from 'react-hot-toast';
import { Button, Card, CalendarPicker, PageHeader, FileUpload } from '@/components/ui';
import type { UploadedFile } from '@/components/ui';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import { TagInput, ParticipantPicker } from '@/components/agenda';

const REPORT_METHODS = ['카톡', '통화', '메일', '회의'];
const HOURS = Array.from({ length: 25 }, (_, i) => i);
const MINUTES = ['00', '30'];

function toDateStr(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('sv-SE');
}

function toHour(iso: string) {
  if (!iso) return '9';
  return String(new Date(iso).getHours());
}

function toMinute(iso: string) {
  if (!iso) return '00';
  const m = new Date(iso).getMinutes();
  return m >= 30 ? '30' : '00';
}

function buildDateTime(date: string, hour: string, minute: string): string {
  const h = Number(hour);
  if (h === 24) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  return new Date(`${date}T${String(h).padStart(2, '0')}:${minute}:00`).toISOString();
}

interface FormData {
  category: AgendaCategory;
  title: string;
  type: string;
  description: string;
  agendaStartDate: string;
  agendaDeadlineDate: string;
  agendaDeadlineAmPm: 'AM' | 'PM';
  schedStartDate: string;
  schedStartHour: string;
  schedStartMinute: string;
  schedEndDate: string;
  schedEndHour: string;
  schedEndMinute: string;
  recurrence: RecurrenceConfig;
  priority: string;
  location: string;
  onlineLink: string;
  reportMethod: string;
  isNotice: boolean;
  tags: string[];
  participantIds: string[];
}

const emptyForm: FormData = {
  category: 'SCHEDULE',
  title: '', type: 'OTHER', description: '',
  agendaStartDate: '', agendaDeadlineDate: '', agendaDeadlineAmPm: 'AM',
  schedStartDate: '', schedStartHour: '9', schedStartMinute: '00',
  schedEndDate: '', schedEndHour: '10', schedEndMinute: '00',
  recurrence: { type: 'NONE' }, priority: 'NORMAL',
  location: '', onlineLink: '', reportMethod: '',
  isNotice: false, tags: [], participantIds: [],
};

export default function AgendaFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { agenda } = useAgenda(isEdit ? id : undefined);

  const createAgenda = useCreateAgenda();
  const updateAgenda = useUpdateAgenda(id ?? '');

  const [form, setForm] = useState<FormData>(() => {
    // URL 파라미터에서 날짜 초기값 설정 (캘린더에서 클릭 시)
    const startParam = searchParams.get('start');
    if (startParam) {
      const d = new Date(startParam);
      const dateStr = d.toLocaleDateString('sv-SE');
      return {
        ...emptyForm,
        schedStartDate: dateStr,
        schedEndDate: dateStr,
      };
    }
    return emptyForm;
  });
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);

  const isSubmitting = createAgenda.isPending || updateAgenda.isPending;

  useEffect(() => {
    if (agenda && isEdit) {
      const isAgenda = agenda.category === 'AGENDA';
      setForm({
        category: agenda.category,
        title: agenda.title,
        type: agenda.type,
        description: agenda.description || '',
        agendaStartDate: isAgenda ? toDateStr(agenda.startAt) : '',
        agendaDeadlineDate: isAgenda && agenda.deadline ? toDateStr(agenda.deadline) : '',
        agendaDeadlineAmPm: isAgenda && agenda.deadline
          ? (new Date(agenda.deadline).getHours() < 13 ? 'AM' : 'PM')
          : 'AM',
        schedStartDate: !isAgenda ? toDateStr(agenda.startAt) : '',
        schedStartHour: !isAgenda ? toHour(agenda.startAt) : '9',
        schedStartMinute: !isAgenda ? toMinute(agenda.startAt) : '00',
        schedEndDate: !isAgenda && agenda.endAt ? toDateStr(agenda.endAt) : '',
        schedEndHour: !isAgenda && agenda.endAt ? toHour(agenda.endAt) : '10',
        schedEndMinute: !isAgenda && agenda.endAt ? toMinute(agenda.endAt) : '00',
        recurrence: agenda.recurrence,
        priority: agenda.priority,
        location: agenda.location || '',
        onlineLink: agenda.onlineLink || '',
        reportMethod: agenda.reportMethod || '',
        isNotice: agenda.isNotice,
        tags: agenda.tags,
        participantIds: agenda.participants.map((p) => p.user.id),
      });
      setSelectedUsers(agenda.participants.map((p) => p.user));
    }
  }, [agenda, isEdit]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // 시작일 변경 시 종료일/마감일이 더 이른 날짜면 초기화
  const handleSchedStartDateChange = (v: string) => {
    setForm((prev) => ({
      ...prev,
      schedStartDate: v,
      schedEndDate: prev.schedEndDate && prev.schedEndDate < v ? v : prev.schedEndDate,
    }));
  };

  const handleAgendaStartDateChange = (v: string) => {
    setForm((prev) => ({
      ...prev,
      agendaStartDate: v,
      agendaDeadlineDate: prev.agendaDeadlineDate && prev.agendaDeadlineDate < v ? '' : prev.agendaDeadlineDate,
    }));
  };;

  const handleAddParticipant = (user: User) => {
    if (!form.participantIds.includes(user.id)) {
      set('participantIds', [...form.participantIds, user.id]);
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleRemoveParticipant = (userId: string) => {
    set('participantIds', form.participantIds.filter((i) => i !== userId));
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('제목을 입력하세요.'); return; }

    let startAt: string;
    let endAt: string | null = null;
    let deadline: string | null = null;

    if (form.category === 'AGENDA') {
      if (!form.agendaStartDate) { toast.error('시작 날짜를 입력하세요.'); return; }
      startAt = new Date(`${form.agendaStartDate}T00:00:00`).toISOString();
      if (form.agendaDeadlineDate) {
        if (form.agendaDeadlineDate < form.agendaStartDate) {
          toast.error('마감기한은 시작 날짜보다 이른 날짜로 설정할 수 없습니다.'); return;
        }
        const h = form.agendaDeadlineAmPm === 'AM' ? 12 : 18;
        deadline = new Date(`${form.agendaDeadlineDate}T${String(h).padStart(2, '0')}:00:00`).toISOString();
      }
    } else {
      if (!form.schedStartDate) { toast.error('시작 날짜를 입력하세요.'); return; }
      if (!form.schedEndDate) { toast.error('종료 날짜를 입력하세요.'); return; }
      startAt = buildDateTime(form.schedStartDate, form.schedStartHour, form.schedStartMinute);
      endAt = buildDateTime(form.schedEndDate, form.schedEndHour, form.schedEndMinute);
      if (new Date(endAt) < new Date(startAt)) {
        toast.error('종료 일시는 시작 일시보다 이른 시간으로 설정할 수 없습니다.'); return;
      }
    }

    const payload = {
      category: form.category,
      title: form.title,
      type: form.type,
      description: form.description || undefined,
      startAt,
      endAt,
      deadline,
      recurrence: form.recurrence,
      priority: form.priority,
      visibility: 'PRIVATE',
      location: form.location || undefined,
      onlineLink: form.onlineLink || undefined,
      reportMethod: form.reportMethod || undefined,
      isNotice: form.isNotice,
      tags: form.tags,
      participantIds: form.participantIds,
    };

    try {
      let agendaId: string;

      if (isEdit) {
        await updateAgenda.mutateAsync(payload);
        agendaId = id!;
      } else {
        const created = await createAgenda.mutateAsync(payload);
        agendaId = created.id;
      }

      // 첨부파일 업로드
      const pendingFiles = uploadFiles.filter((f) => f.status === 'pending');
      let uploadFailed = false;
      for (const uf of pendingFiles) {
        try {
          const formData = new FormData();
          formData.append('file', uf.file);
          await api.post(`/agendas/${agendaId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch {
          uploadFailed = true;
        }
      }

      if (uploadFailed) {
        toast.error('일정은 저장됐지만 일부 첨부파일 업로드에 실패했습니다.');
      } else {
        toast.success(isEdit ? '수정되었습니다.' : '일정이 생성되었습니다.');
      }
      navigate(`/agendas/${agendaId}`);
    } catch {
      toast.error(isEdit ? '수정에 실패했습니다.' : '생성에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={isEdit ? `${CATEGORY_LABELS[form.category]} 수정` : '새 일정'} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 카테고리 토글 */}
        {!isEdit && (
          <div className="flex gap-2">
            {(Object.entries(CATEGORY_LABELS) as [AgendaCategory, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => set('category', key)}
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
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={`${CATEGORY_LABELS[form.category]} 제목`} autoFocus />
            </FormField>

            {form.category === 'SCHEDULE' && (
              <FormField label="유형">
                <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                  {Object.entries(AGENDA_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </FormField>
            )}

            {form.category === 'AGENDA' && (
              <>
                <FormField label="시작 날짜" required>
                  <CalendarPicker value={form.agendaStartDate} onChange={handleAgendaStartDateChange} />
                </FormField>
                <FormField label="마감기한">
                  <CalendarPicker value={form.agendaDeadlineDate} onChange={(v) => set('agendaDeadlineDate', v)} minDate={form.agendaStartDate || undefined} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(['AM', 'PM'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => set('agendaDeadlineAmPm', v)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                          form.agendaDeadlineAmPm === v
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {v === 'AM' ? '오전' : '오후'}
                      </button>
                    ))}
                  </div>
                </FormField>
              </>
            )}

            {form.category === 'SCHEDULE' && (
              <>
                <FormField label="시작" required>
                  <CalendarPicker value={form.schedStartDate} onChange={handleSchedStartDateChange} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Select value={form.schedStartHour} onChange={(e) => set('schedStartHour', e.target.value)}>
                      {HOURS.map((h) => <option key={h} value={String(h)}>{String(h).padStart(2, '0')}시</option>)}
                    </Select>
                    <Select value={form.schedStartMinute} onChange={(e) => set('schedStartMinute', e.target.value)}>
                      {MINUTES.map((m) => <option key={m} value={m}>{m}분</option>)}
                    </Select>
                  </div>
                </FormField>
                <FormField label="종료" required>
                  <CalendarPicker value={form.schedEndDate} onChange={(v) => set('schedEndDate', v)} minDate={form.schedStartDate || undefined} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Select value={form.schedEndHour} onChange={(e) => set('schedEndHour', e.target.value)}>
                      {HOURS.map((h) => <option key={h} value={String(h)}>{String(h).padStart(2, '0')}시</option>)}
                    </Select>
                    <Select value={form.schedEndMinute} onChange={(e) => set('schedEndMinute', e.target.value)}>
                      {MINUTES.map((m) => <option key={m} value={m}>{m}분</option>)}
                    </Select>
                  </div>
                </FormField>
                <FormField label="반복">
                  <Select value={form.recurrence.type} onChange={(e) => set('recurrence', { ...form.recurrence, type: e.target.value as RecurrenceConfig['type'] })}>
                    {Object.entries(RECURRENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </FormField>
              </>
            )}

            {form.category === 'AGENDA' ? (
              <FormField label="보고방식">
                <div className="flex flex-wrap gap-2">
                  {REPORT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => set('reportMethod', form.reportMethod === method ? '' : method)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.reportMethod === method
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </FormField>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="장소">
                  <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="회의실 / 장소" />
                </FormField>
                <FormField label="온라인 링크">
                  <Input type="url" value={form.onlineLink} onChange={(e) => set('onlineLink', e.target.value)} placeholder="https://zoom.us/..." />
                </FormField>
              </div>
            )}

            <FormField label="참여자">
              <ParticipantPicker
                selectedUsers={selectedUsers}
                participantIds={form.participantIds}
                onAdd={handleAddParticipant}
                onRemove={handleRemoveParticipant}
              />
            </FormField>

            <FormField label="설명 / 메모">
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="마크다운 지원" />
            </FormField>
          </div>
        </Card>

        <Card>
          <FormField label="태그">
            <TagInput tags={form.tags} onChange={(tags) => set('tags', tags)} />
          </FormField>
        </Card>

        <Card>
          <FormField label="첨부파일">
            <FileUpload files={uploadFiles} onChange={setUploadFiles} />
          </FormField>
        </Card>

        <div className="flex gap-3 justify-end pb-24">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>취소</Button>
          <Button type="submit" isLoading={isSubmitting}>{isEdit ? '수정' : '생성'}</Button>
        </div>
      </form>
    </div>
  );
}
