import { useEffect, useState } from 'react';

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light'
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || Theme.DARK;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(Theme.LIGHT, Theme.DARK);
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === Theme.DARK ? Theme.LIGHT : Theme.DARK));
  };

  const isDarkMode = theme === Theme.DARK;

  return { theme, setTheme, toggleTheme, isDarkMode };
};
