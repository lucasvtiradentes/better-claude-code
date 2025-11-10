import { useMemo } from 'react';
import type { GetApiSessionsProjectNameSessionId200MessagesItem } from '@/api';

interface MessageGroup {
  messages: GetApiSessionsProjectNameSessionId200MessagesItem[];
  startIndex: number;
}

export function useMessageGrouping(messages: GetApiSessionsProjectNameSessionId200MessagesItem[]): MessageGroup[] {
  return useMemo(() => {
    const groupedMessages: MessageGroup[] = [];
    let currentGroup: GetApiSessionsProjectNameSessionId200MessagesItem[] = [];
    let currentGroupStartIndex = 0;

    messages.forEach((message, idx) => {
      if (currentGroup.length === 0) {
        currentGroup = [message];
        currentGroupStartIndex = idx;
      } else if (currentGroup[0].type === message.type) {
        currentGroup.push(message);
      } else {
        groupedMessages.push({
          messages: currentGroup,
          startIndex: currentGroupStartIndex
        });
        currentGroup = [message];
        currentGroupStartIndex = idx;
      }
    });

    if (currentGroup.length > 0) {
      groupedMessages.push({
        messages: currentGroup,
        startIndex: currentGroupStartIndex
      });
    }

    return groupedMessages;
  }, [messages]);
}
