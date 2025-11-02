import type { Message, SessionData } from '@bcc/shared';
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

type GroupedMessage = {
  type: 'user' | 'assistant';
  messages: Message[];
};

export const groupMessages = (messages: Message[]): GroupedMessage[] => {
  const groups: GroupedMessage[] = [];
  let currentGroup: GroupedMessage | null = null;

  for (const message of messages) {
    if (!currentGroup || currentGroup.type !== message.type) {
      currentGroup = { type: message.type, messages: [message] };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(message);
    }
  }

  return groups;
};
