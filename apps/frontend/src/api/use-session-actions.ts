import { useMutation, useQueryClient } from '@tanstack/react-query';

const deleteSession = async (projectId: string, sessionId: string): Promise<void> => {
  const response = await fetch(`/api/sessions/${projectId}/${sessionId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
};

const toggleSessionLabel = async (projectId: string, sessionId: string, labelId: string): Promise<void> => {
  const response = await fetch(`/api/sessions/${projectId}/${sessionId}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labelId })
  });

  if (!response.ok) {
    throw new Error('Failed to toggle label');
  }
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, sessionId }: { projectId: string; sessionId: string }) =>
      deleteSession(projectId, sessionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.projectId] });
    }
  });
};

export const useToggleSessionLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, sessionId, labelId }: { projectId: string; sessionId: string; labelId: string }) =>
      toggleSessionLabel(projectId, sessionId, labelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.projectId] });
    }
  });
};
