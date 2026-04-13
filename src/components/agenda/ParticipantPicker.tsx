import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Avatar } from '@/components/ui';
import { Input } from '@/components/ui/FormField';
import type { ApiResponse, User } from '@/types';

interface ParticipantPickerProps {
  selectedUsers: User[];
  participantIds: string[];
  onAdd: (user: User) => void;
  onRemove: (userId: string) => void;
}

export default function ParticipantPicker({ selectedUsers, participantIds, onAdd, onRemove }: ParticipantPickerProps) {
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    if (userSearch.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await api.get<ApiResponse<User[]>>(`/users?search=${userSearch}`);
        setSearchResults(data.data.filter((u) => !participantIds.includes(u.id)));
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timeout);
  }, [userSearch, participantIds]);

  const handleAdd = (user: User) => {
    onAdd(user);
    setUserSearch('');
    setSearchResults([]);
  };

  return (
    <div>
      <div className="relative mb-3">
        <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="이름 또는 이메일로 검색..." />
        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((user) => (
              <button key={user.id} type="button" onClick={() => handleAdd(user)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-left">
                <Avatar name={user.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.department?.name} · {user.position}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          {selectedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <Avatar name={user.name} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.department?.name}</p>
              </div>
              <button type="button" onClick={() => onRemove(user.id)} className="text-slate-400 hover:text-rose-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
