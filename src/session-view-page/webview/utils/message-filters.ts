import type { FilterState } from '../stores/filters';
import type { SessionMessageType } from '../types';

export const filterMessages = (messages: SessionMessageType[], filters: FilterState): SessionMessageType[] => {
  const { showUserMessages, showAssistantMessages, showToolCalls } = filters;

  let filtered = messages.filter(
    (msg) => (msg.type === 'user' && showUserMessages) || (msg.type === 'assistant' && showAssistantMessages)
  );

  if (!showToolCalls) {
    filtered = filtered
      .map((msg) => {
        if (typeof msg.content !== 'string') return msg;

        const lines = msg.content.split('\n');
        const filteredLines = lines.filter((line) => !line.trim().startsWith('[Tool:'));

        let cleaned = filteredLines.join('\n');

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

  return filtered;
};

export const groupMessagesByType = (messages: SessionMessageType[]): SessionMessageType[][] => {
  const groupedMessages: SessionMessageType[][] = [];
  let currentGroup: SessionMessageType[] = [];
  let lastType = '';

  for (const message of messages) {
    if (message.type !== lastType && currentGroup.length > 0) {
      groupedMessages.push([...currentGroup]);
      currentGroup = [];
    }
    currentGroup.push(message);
    lastType = message.type;
  }

  if (currentGroup.length > 0) {
    groupedMessages.push(currentGroup);
  }

  return groupedMessages;
};

export const countFilesOrFolders = (messages: SessionMessageType[]): number => {
  const fileOrFolderRegex = /@[\w\-./]+/g;
  let count = 0;

  for (const message of messages) {
    if (typeof message.content === 'string' && message.type === 'user') {
      const matches = message.content.match(fileOrFolderRegex);
      if (matches) {
        count += matches.length;
      }
    }
  }

  return count;
};
