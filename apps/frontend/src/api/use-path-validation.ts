import { useQuery } from '@tanstack/react-query';

interface PathValidation {
  path: string;
  exists: boolean;
}

export function usePathValidation(projectId: string, sessionId: string) {
  return useQuery({
    queryKey: ['path-validation', projectId, sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${projectId}/${sessionId}/paths`);
      if (!response.ok) throw new Error('Failed to fetch path validation');
      return response.json() as Promise<PathValidation[]>;
    },
    enabled: !!projectId && !!sessionId,
    staleTime: 1000 * 60 * 5
  });
}
