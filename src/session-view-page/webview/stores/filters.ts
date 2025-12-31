import { derived, writable } from 'svelte/store';
import { countFilesOrFolders, filterMessages, groupMessagesByType } from '../utils/message-filters';
import { vscode } from '../utils/vscode';
import { sessionStore } from './session';

export interface FilterState {
  showUserMessages: boolean;
  showAssistantMessages: boolean;
  showToolCalls: boolean;
}

const defaultFilters: FilterState = {
  showUserMessages: true,
  showAssistantMessages: true,
  showToolCalls: true
};

function createFiltersStore() {
  const { subscribe, set, update } = writable<FilterState>(defaultFilters);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function init() {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'filtersUpdated') {
        set(message.filters);
      }
    });
  }

  function toggle(key: keyof FilterState) {
    update((state) => {
      const newState = { ...state, [key]: !state[key] };
      saveFilters(newState);
      return newState;
    });
  }

  function saveFilters(filters: FilterState) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      vscode.postMessage({ type: 'saveFilters', filters });
    }, 300);
  }

  function setFromSession(filters: FilterState) {
    set(filters);
  }

  return {
    subscribe,
    init,
    toggle,
    setFromSession
  };
}

export const filtersStore = createFiltersStore();

export const groupedMessages = derived([sessionStore, filtersStore], ([$session, $filters]) => {
  if (!$session?.conversation?.messages) return [];

  const filtered = filterMessages($session.conversation.messages, $filters);
  return groupMessagesByType(filtered);
});

export const filesOrFoldersCount = derived([sessionStore, filtersStore], ([$session, $filters]) => {
  if (!$session?.conversation?.messages) return 0;

  const filtered = filterMessages($session.conversation.messages, $filters);
  return countFilesOrFolders(filtered);
});
