import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export default function PageHeader({ title, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {badge}
      </div>
      {actions}
    </div>
  );
}
