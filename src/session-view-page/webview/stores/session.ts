import { writable } from 'svelte/store';
import type { SessionData } from '../types';
import { vscode } from '../utils/vscode';

function createSessionStore() {
  const { subscribe, set } = writable<SessionData | null>(null);

  function init() {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'sessionData') {
        set(message.data);
      }
    });

    vscode.postMessage({ type: 'ready' });
  }

  return {
    subscribe,
    init
  };
}

export const sessionStore = createSessionStore();
