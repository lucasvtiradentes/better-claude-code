import type { Project } from '@better-claude-code/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
};

const executeProjectAction = async (
  projectId: string,
  action: 'openFolder' | 'openCodeEditor' | 'openTerminal'
): Promise<void> => {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/action/${action}`, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error(`Failed to ${action}`);
  }
};

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    placeholderData: (previousData) => previousData
  });
};

export const useProjectAction = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      action
    }: {
      projectId: string;
      action: 'openFolder' | 'openCodeEditor' | 'openTerminal';
    }) => executeProjectAction(projectId, action)
  });
};
