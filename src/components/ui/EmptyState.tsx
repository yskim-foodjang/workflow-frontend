import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, action }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-12 text-center">
      {icon && <div className="mb-3 flex justify-center text-slate-300 dark:text-slate-600">{icon}</div>}
      <p className="text-slate-500 dark:text-slate-400">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
