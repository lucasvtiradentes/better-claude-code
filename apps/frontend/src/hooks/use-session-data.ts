import type { SessionData } from '@better-claude-code/shared';
import { useQuery } from '@tanstack/react-query';

const fetchSessionData = async (projectName: string, sessionId: string): Promise<SessionData> => {
  const [messagesRes, imagesRes] = await Promise.all([
    fetch(`/api/sessions/${encodeURIComponent(projectName)}/${encodeURIComponent(sessionId)}`),
    fetch(`/api/sessions/${encodeURIComponent(projectName)}/${encodeURIComponent(sessionId)}/images`)
  ]);

  if (!messagesRes.ok || !imagesRes.ok) {
    throw new Error('Failed to fetch session data');
  }

  const { messages } = await messagesRes.json();
  const images = await imagesRes.json();

  return { messages, images };
};

export const useSessionData = (projectName: string, sessionId: string) => {
  return useQuery({
    queryKey: ['session', projectName, sessionId],
    queryFn: () => fetchSessionData(projectName, sessionId),
    enabled: !!projectName && !!sessionId
  });
};
