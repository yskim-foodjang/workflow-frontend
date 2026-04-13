import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50',
  secondary: 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50',
  ghost: 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs py-1.5 px-3',
  md: 'text-sm py-2.5 px-4',
  lg: 'text-base py-3 px-6',
};

export default function Button({ variant = 'primary', size = 'md', children, isLoading, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-medium rounded-lg transition-colors duration-150 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
