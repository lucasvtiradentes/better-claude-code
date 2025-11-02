import type { Session } from '@bcc/shared';
import { useQuery } from '@tanstack/react-query';

const fetchSessions = async (repoName: string): Promise<Session[]> => {
  const response = await fetch(`/api/sessions/${encodeURIComponent(repoName)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  return response.json();
};

export const useSessions = (repoName: string) => {
  return useQuery({
    queryKey: ['sessions', repoName],
    queryFn: () => fetchSessions(repoName),
    enabled: !!repoName
  });
};
