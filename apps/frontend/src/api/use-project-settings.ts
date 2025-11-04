import { useMutation, useQueryClient } from '@tanstack/react-query';

const updateProjectLabels = async (projectId: string, labels: string[]): Promise<void> => {
  const response = await fetch(`/api/settings/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labels })
  });

  if (!response.ok) {
    throw new Error('Failed to update project labels');
  }
};

export const useUpdateProjectLabels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, labels }: { projectId: string; labels: string[] }) =>
      updateProjectLabels(projectId, labels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
};
