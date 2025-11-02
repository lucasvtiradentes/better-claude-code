import type { SessionData } from '@bcc/shared';
import { useQuery } from '@tanstack/react-query';

const fetchSessionData = async (repoName: string, sessionId: string): Promise<SessionData> => {
  const [messagesRes, imagesRes] = await Promise.all([
    fetch(`/api/sessions/${encodeURIComponent(repoName)}/${encodeURIComponent(sessionId)}`),
    fetch(`/api/sessions/${encodeURIComponent(repoName)}/${encodeURIComponent(sessionId)}/images`)
  ]);

  if (!messagesRes.ok || !imagesRes.ok) {
    throw new Error('Failed to fetch session data');
  }

  const { messages } = await messagesRes.json();
  const images = await imagesRes.json();

  return { messages, images };
};

export const useSessionData = (repoName: string, sessionId: string) => {
  return useQuery({
    queryKey: ['session', repoName, sessionId],
    queryFn: () => fetchSessionData(repoName, sessionId),
    enabled: !!repoName && !!sessionId
  });
};
