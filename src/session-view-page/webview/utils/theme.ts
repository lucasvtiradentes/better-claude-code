import { readable } from 'svelte/store';

type Theme = 'dark' | 'light';

function getTheme(): Theme {
  return document.documentElement.classList.contains('vscode-light') ? 'light' : 'dark';
}

export const theme = readable<Theme>(getTheme(), (set) => {
  const observer = new MutationObserver(() => {
    set(getTheme());
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  return () => observer.disconnect();
});
