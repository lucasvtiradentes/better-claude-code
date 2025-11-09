import { Link, useRouterState } from '@tanstack/react-router';
import { Edit, FolderOpen, Home, Moon, Settings as SettingsIcon, Sun } from 'lucide-react';
import { Theme, useTheme } from '@/common/hooks/use-theme';

type NavItem = {
  path: string;
  icon: typeof Home;
  label: string;
};

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/projects', icon: FolderOpen, label: 'Projects' },
  { path: '/files', icon: Edit, label: 'Files' },
  { path: '/settings', icon: SettingsIcon, label: 'Settings' }
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
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`
              h-[60px] flex items-center justify-center cursor-pointer
              border-b border-border transition-all duration-100
              relative group
              ${!active && 'hover:bg-accent'}
            `}
            aria-label={item.label}
            title={item.label}
          >
            {active && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />}
            <Icon size={24} className={active ? 'text-primary' : 'text-foreground'} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </Link>
        );
      })}
      <div className="flex-1" />
      <button
        type="button"
        onClick={toggleTheme}
        className="h-[60px] flex items-center justify-center cursor-pointer border-t border-border transition-all duration-100 hover:bg-accent group relative"
        aria-label={`Switch to ${theme === Theme.DARK ? Theme.LIGHT : Theme.DARK} mode`}
        title={`Switch to ${theme === Theme.DARK ? Theme.LIGHT : Theme.DARK} mode`}
      >
        {theme === Theme.DARK ? (
          <Sun size={24} className="text-foreground" />
        ) : (
          <Moon size={24} className="text-foreground" />
        )}
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {theme === Theme.DARK ? `${Theme.LIGHT} mode` : `${Theme.DARK} mode`}
        </div>
      </button>
    </nav>
  );
};
