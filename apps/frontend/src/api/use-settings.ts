import type { AppSettings, ProjectLabel, ProjectsConfig, SessionsConfig } from '@better-claude-code/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const fetchSettings = async (): Promise<AppSettings> => {
  const response = await fetch('/api/settings');
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
};

const updateProjectsSettings = async (updates: Partial<ProjectsConfig>): Promise<void> => {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects: updates })
  });

  if (!response.ok) {
    throw new Error('Failed to update settings');
  }
};

const updateSessionsSettings = async (updates: Partial<SessionsConfig>): Promise<void> => {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessions: updates })
  });

  if (!response.ok) {
    throw new Error('Failed to update sessions settings');
  }
};

const addLabel = async (label: ProjectLabel): Promise<void> => {
  const response = await fetch('/api/settings/labels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(label)
  });

  if (!response.ok) {
    throw new Error('Failed to add label');
  }
};

const updateLabel = async (id: string, updates: Partial<ProjectLabel>): Promise<void> => {
  const response = await fetch(`/api/settings/labels/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update label');
  }
};

const deleteLabel = async (id: string): Promise<void> => {
  const response = await fetch(`/api/settings/labels/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Failed to delete label');
  }
};

const addSessionLabel = async (label: ProjectLabel): Promise<void> => {
  const response = await fetch('/api/settings/sessions/labels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(label)
  });

  if (!response.ok) {
    throw new Error('Failed to add session label');
  }
};

const updateSessionLabel = async (id: string, updates: Partial<ProjectLabel>): Promise<void> => {
  const response = await fetch(`/api/settings/sessions/labels/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update session label');
  }
};

const deleteSessionLabel = async (id: string): Promise<void> => {
  const response = await fetch(`/api/settings/sessions/labels/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Failed to delete session label');
  }
};

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<ProjectsConfig>) => updateProjectsSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
};

export const useUpdateSessionsSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<SessionsConfig>) => updateSessionsSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
};

export const useAddLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: ProjectLabel) => addLabel(label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
};

export const useUpdateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectLabel> }) => updateLabel(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
};

export const useDeleteLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
};

export const useAddSessionLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: ProjectLabel) => addSessionLabel(label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
};

export const useUpdateSessionLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectLabel> }) => updateSessionLabel(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
};

export const useDeleteSessionLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSessionLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
};
