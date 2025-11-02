import { Link, useRouterState } from '@tanstack/react-router';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/use-theme';

type NavItem = {
  path: string;
  icon: string;
  label: string;
};

const navItems: NavItem[] = [
  { path: '/', icon: '🏠', label: 'Home' },
  { path: '/projects', icon: '📁', label: 'Projects' },
  { path: '/settings', icon: '⚙️', label: 'Settings' }
];

export const IconNavigation = () => {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <nav className="w-[60px] bg-card border-r border-border flex flex-col">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`
            h-[60px] flex items-center justify-center cursor-pointer
            border-b border-border transition-all duration-100
            relative
            hover:bg-accent
            ${isActive(item.path) ? 'bg-primary/20' : ''}
          `}
          aria-label={item.label}
        >
          {isActive(item.path) && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />}
          <span className="text-2xl">{item.icon}</span>
        </Link>
      ))}
      <div className="flex-1" />
      <button
        type="button"
        onClick={toggleTheme}
        className="h-[60px] flex items-center justify-center cursor-pointer border-t border-border transition-all duration-100 hover:bg-accent"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun size={24} className="text-foreground" />
        ) : (
          <Moon size={24} className="text-foreground" />
        )}
      </button>
    </nav>
  );
};
