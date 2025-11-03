import type { ProjectLabel, SessionsConfig } from '@better-claude-code/shared';
import { create } from 'zustand';

type SessionsStore = {
  settings: SessionsConfig | null;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SessionsConfig>) => Promise<void>;
  addLabel: (label: ProjectLabel) => Promise<void>;
  updateLabel: (labelId: string, updates: Partial<ProjectLabel>) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
};

export const useSessionsStore = create<SessionsStore>((set, get) => ({
  settings: null,

  loadSettings: async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      set({ settings: data.sessions });
    } catch (error) {
      console.error('Failed to load sessions settings:', error);
    }
  },

  updateSettings: async (updates: Partial<SessionsConfig>) => {
    const currentSettings = get().settings;
    if (!currentSettings) return;

    const newSettings = { ...currentSettings, ...updates };
    set({ settings: newSettings });

    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: newSettings })
      });
    } catch (error) {
      console.error('Failed to update sessions settings:', error);
      set({ settings: currentSettings });
    }
  },

  addLabel: async (label: ProjectLabel) => {
    try {
      await fetch('/api/settings/sessions/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(label)
      });
      await get().loadSettings();
    } catch (error) {
      console.error('Failed to add label:', error);
    }
  },

  updateLabel: async (labelId: string, updates: Partial<ProjectLabel>) => {
    try {
      await fetch(`/api/settings/sessions/labels/${labelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      await get().loadSettings();
    } catch (error) {
      console.error('Failed to update label:', error);
    }
  },

  deleteLabel: async (labelId: string) => {
    try {
      await fetch(`/api/settings/sessions/labels/${labelId}`, {
        method: 'DELETE'
      });
      await get().loadSettings();
    } catch (error) {
      console.error('Failed to delete label:', error);
    }
  }
}));
