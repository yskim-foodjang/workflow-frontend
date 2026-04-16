import { useState, useEffect, useRef } from 'react';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarPicker({
  value,
  onChange,
  placeholder = '날짜 선택',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const today = new Date();
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [month, setMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const prevMonth = () =>
    month === 0 ? (setMonth(11), setYear((y) => y - 1)) : setMonth((m) => m - 1);
  const nextMonth = () =>
    month === 11 ? (setMonth(0), setYear((y) => y + 1)) : setMonth((m) => m + 1);

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const handleSelect = (day: number) => {
    onChange(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    setOpen(false);
  };

  const displayValue = selected
    ? selected.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field w-full text-left flex items-center gap-2"
      >
        <svg
          className="w-4 h-4 text-slate-400 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className={displayValue ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
          {displayValue || placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 w-72">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <svg
                className="w-4 h-4 text-slate-600 dark:text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {year}년 {month + 1}월
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <svg
                className="w-4 h-4 text-slate-600 dark:text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                className={`text-center text-xs font-medium py-1 ${
                  i === 0
                    ? 'text-rose-500'
                    : i === 6
                    ? 'text-blue-500'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, idx) =>
              day === null ? (
                <div key={`e-${idx}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                    ${
                      selected &&
                      day === selected.getDate() &&
                      month === selected.getMonth() &&
                      year === selected.getFullYear()
                        ? 'bg-primary-600 text-white font-semibold'
                        : day === today.getDate() &&
                          month === today.getMonth() &&
                          year === today.getFullYear()
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold'
                        : idx % 7 === 0
                        ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                        : idx % 7 === 6
                        ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                  {day}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setYear(today.getFullYear());
              setMonth(today.getMonth());
              handleSelect(today.getDate());
            }}
            className="mt-2 w-full text-xs text-center text-primary-600 dark:text-primary-400 hover:underline py-1"
          >
            오늘
          </button>
        </div>
      )}
    </div>
  );
}
