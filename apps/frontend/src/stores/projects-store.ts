import type { AppSettings, ProjectLabel, ProjectSettings, ProjectsConfig } from '@bcc/shared';
import { create } from 'zustand';

type ProjectsStore = {
  settings: ProjectsConfig | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<ProjectsConfig>) => Promise<void>;
  setGroupBy: (groupBy: ProjectsConfig['groupBy']) => Promise<void>;
  setSearch: (search: string) => void;
  toggleFilter: (filter: keyof ProjectsConfig['filters']) => Promise<void>;
  toggleDisplay: (display: keyof ProjectsConfig['display']) => Promise<void>;
  setFilters: (filters: Partial<ProjectsConfig['filters']>) => Promise<void>;
  addLabel: (label: ProjectLabel) => Promise<void>;
  updateLabel: (id: string, label: Partial<ProjectLabel>) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  updateProjectSettings: (projectId: string, settings: Partial<ProjectSettings>) => Promise<void>;
};

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  settings: null,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/settings');
      const data: AppSettings = await response.json();
      set({ settings: data.projects, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates: Partial<ProjectsConfig>) => {
    const current = get().settings;
    if (!current) return;

    const newSettings = { ...current, ...updates };
    set({ settings: newSettings });

    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: updates })
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      set({ settings: current });
    }
  },

  setGroupBy: async (groupBy) => {
    await get().updateSettings({ groupBy });
  },

  setSearch: (search) => {
    const current = get().settings;
    if (current) {
      set({ settings: { ...current, search } });
    }
  },

  toggleFilter: async (filter) => {
    const current = get().settings;
    if (!current) return;

    const newFilters = {
      ...current.filters,
      [filter]: current.filters[filter]
    };

    await get().updateSettings({ filters: newFilters });
  },

  toggleDisplay: async (display) => {
    const current = get().settings;
    if (!current) return;

    const newDisplay = {
      ...current.display,
      [display]: !current.display[display]
    };

    await get().updateSettings({ display: newDisplay });
  },

  setFilters: async (filters) => {
    const current = get().settings;
    if (!current) return;

    const newFilters = { ...current.filters, ...filters };
    await get().updateSettings({ filters: newFilters });
  },

  addLabel: async (label) => {
    try {
      const response = await fetch('/api/settings/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(label)
      });

      if (response.ok) {
        const current = get().settings;
        if (current) {
          set({
            settings: {
              ...current,
              labels: [...current.labels, label]
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to add label:', error);
    }
  },

  updateLabel: async (id, updates) => {
    try {
      const response = await fetch(`/api/settings/labels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const current = get().settings;
        if (current) {
          set({
            settings: {
              ...current,
              labels: current.labels.map((l) => (l.id === id ? { ...l, ...updates } : l))
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to update label:', error);
    }
  },

  deleteLabel: async (id) => {
    try {
      const response = await fetch(`/api/settings/labels/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const current = get().settings;
        if (current) {
          set({
            settings: {
              ...current,
              labels: current.labels.filter((l) => l.id !== id)
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to delete label:', error);
    }
  },

  updateProjectSettings: async (projectId, settings) => {
    try {
      const response = await fetch(`/api/settings/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const current = get().settings;
        if (current) {
          set({
            settings: {
              ...current,
              projectSettings: {
                ...current.projectSettings,
                [projectId]: {
                  ...current.projectSettings[projectId],
                  ...settings
                }
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to update project settings:', error);
    }
  }
}));
