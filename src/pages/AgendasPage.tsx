import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAgendas } from '@/hooks/useAgendas';
import { AGENDA_TYPE_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '@/utils/constants';
import clsx from 'clsx';
import { Button, Card, PageHeader, EmptyState, SkeletonList } from '@/components/ui';
import { Input, Select } from '@/components/ui/FormField';
import { AgendaCard } from '@/components/agenda';

export default function AgendasPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 대시보드 "미완료 일정" 카드 클릭 시 ?completed=false 로 진입
  const completedParam = searchParams.get('completed') ?? undefined;

  const { agendas, isLoading, hasMore, loadMore } = useAgendas({
    search: debouncedSearch,
    category: categoryFilter || undefined,
    type: typeFilter || undefined,
    priority: priorityFilter || undefined,
    completed: completedParam,
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') setDebouncedSearch(search);
  };

  return (
    <div>
      <PageHeader
        title="일정 관리"
        actions={
          <Link to="/agendas/new">
            <Button>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">새 일정</span>
            </Button>
          </Link>
        }
      />

      <Card padding="sm" className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="제목, 설명, 태그 검색..."
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
          </div>
          <Button onClick={() => setDebouncedSearch(search)}>검색</Button>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className={clsx(showFilters && 'ring-2 ring-primary-500')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-auto">
              <option value="">모든 구분</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-auto">
              <option value="">모든 유형</option>
              {Object.entries(AGENDA_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-auto">
              <option value="">모든 우선순위</option>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            {(categoryFilter || typeFilter || priorityFilter) && (
              <button onClick={() => { setCategoryFilter(''); setTypeFilter(''); setPriorityFilter(''); }} className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                필터 초기화
              </button>
            )}
          </div>
        )}
      </Card>

      {isLoading && agendas.length === 0 ? (
        <SkeletonList count={5} />
      ) : agendas.length === 0 ? (
        <EmptyState
          icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          title="등록된 일정이 없습니다."
          action={<Link to="/agendas/new" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium">첫 일정 만들기</Link>}
        />
      ) : (
        <div className="space-y-2">
          {agendas.map((agenda) => <AgendaCard key={agenda.id} agenda={agenda} />)}
          {hasMore && (
            <button onClick={loadMore} className="w-full py-3 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
              더 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
