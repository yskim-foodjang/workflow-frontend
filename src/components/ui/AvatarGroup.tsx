import clsx from 'clsx';

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-7 h-7 text-xs',
};

export default function AvatarGroup({ names, max = 3, size = 'md' }: AvatarGroupProps) {
  const visible = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((name, i) => (
        <div
          key={i}
          className={clsx(
            'rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium ring-2 ring-white dark:ring-slate-800',
            sizeClasses[size]
          )}
          title={name}
        >
          {name.charAt(0)}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium ring-2 ring-white dark:ring-slate-800',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
