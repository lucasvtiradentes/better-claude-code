import { MessageSource } from '@better-claude-code/shared';
import { useState } from 'react';
import type { GetApiSessionsProjectNameSessionId200MessagesItem } from '@/api/_generated/schemas';

export function useMessageFilter(
  messages: GetApiSessionsProjectNameSessionId200MessagesItem[],
  showUserMessages: boolean,
  showAssistantMessages: boolean,
  showToolCalls: boolean,
  searchQuery?: string
) {
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  let filteredMessages = messages.filter(
    (msg) =>
      (msg.type === MessageSource.USER && showUserMessages) || (msg.type === MessageSource.CC && showAssistantMessages)
  );

  if (!showToolCalls) {
    filteredMessages = filteredMessages
      .map((msg) => {
        if (typeof msg.content !== 'string') return msg;

        const lines = msg.content.split('\n');
        const filtered = lines.filter((line) => !line.trim().startsWith('[Tool:'));

        let cleaned = filtered.join('\n');

        while (cleaned.includes('---\n---')) {
          cleaned = cleaned.replace(/---\n---/g, '---');
        }

        cleaned = cleaned
          .split('\n---\n')
          .filter((part) => part.trim().length > 0)
          .join('\n---\n')
          .replace(/^\n*---\n*/g, '')
          .replace(/\n*---\n*$/g, '')
          .trim();

        return { ...msg, content: cleaned };
      })
      .filter((msg) => {
        if (typeof msg.content === 'string') {
          return msg.content.trim().length > 0;
        }
        return true;
      });
  }

  const searchMatches: number[] = [];
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase();
    filteredMessages.forEach((msg, idx) => {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      if (content.toLowerCase().includes(searchLower)) {
        searchMatches.push(idx);
      }
    });
  }

  const handleNextMatch = () => {
    const nextIndex = Math.min(searchMatchIndex + 1, searchMatches.length - 1);
    setSearchMatchIndex(nextIndex);
    const messageElement = document.querySelector(`[data-message-index="${searchMatches[nextIndex]}"]`) as HTMLElement;
    messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePreviousMatch = () => {
    const prevIndex = Math.max(searchMatchIndex - 1, 0);
    setSearchMatchIndex(prevIndex);
    const messageElement = document.querySelector(`[data-message-index="${searchMatches[prevIndex]}"]`) as HTMLElement;
    messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return {
    filteredMessages,
    searchMatches,
    searchMatchIndex,
    handleNextMatch,
    handlePreviousMatch
  };
}
