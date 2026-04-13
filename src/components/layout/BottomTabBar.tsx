import { NavLink } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface BottomTabBarProps {
  navItems: NavItem[];
}

export default function BottomTabBar({ navItems }: BottomTabBarProps) {
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex sm:hidden">
      {navItems.slice(0, 5).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            clsx(
              'flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors relative',
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-400 dark:text-slate-500'
            )
          }
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
          {item.to === '/notifications' && unreadCount > 0 && (
            <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
