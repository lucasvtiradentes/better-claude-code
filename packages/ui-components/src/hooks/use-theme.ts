import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

export const useTheme = (): { theme: Theme } => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const observer = new MutationObserver(() => {
      const isDark = root.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return { theme };
};
