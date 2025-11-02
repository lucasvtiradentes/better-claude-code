import { Link, useRouterState } from '@tanstack/react-router';

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

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <nav className="w-[60px] bg-[#333333] border-r border-[#3e3e42] flex flex-col">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`
            h-[60px] flex items-center justify-center cursor-pointer
            border-b border-[#3e3e42] transition-all duration-100
            relative
            hover:bg-[#2a2a2a]
            ${isActive(item.path) ? 'bg-[#094771]' : ''}
          `}
          aria-label={item.label}
        >
          {isActive(item.path) && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#007acc]" />}
          <span className="text-2xl">{item.icon}</span>
        </Link>
      ))}
    </nav>
  );
};
