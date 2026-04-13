import type { ReactNode } from 'react';
import clsx from 'clsx';

interface PageWrapperProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: '',
};

export default function PageWrapper({ children, maxWidth = 'full', className }: PageWrapperProps) {
  return (
    <div className={clsx(maxWidth !== 'full' && `${maxWidthClasses[maxWidth]} mx-auto`, className)}>
      {children}
    </div>
  );
}
