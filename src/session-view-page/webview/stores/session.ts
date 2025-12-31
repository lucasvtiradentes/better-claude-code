import { writable } from 'svelte/store';
import type { SessionData } from '../types';
import { vscode } from '../utils/vscode';

function createSessionStore() {
  const { subscribe, set } = writable<SessionData | null>(null);

  function init() {
    console.log('[BCC Store] sessionStore.init() called');
    window.addEventListener('message', (event) => {
      const message = event.data;
      console.log('[BCC Store] Message received:', message.type, message);
      if (message.type === 'sessionData') {
        console.log('[BCC Store] Setting session data:', message.data);
        set(message.data);
      }
    });

    console.log('[BCC Store] Sending ready message');
    vscode.postMessage({ type: 'ready' });
  }

  return {
    subscribe,
    init
  };
}

export const sessionStore = createSessionStore();
