import { useMemo, useState } from 'react';
import type { SessionData } from '../types';
import { countFilesOrFolders, filterMessages, groupMessagesByType } from '../utils/message-filters';

export const useMessageFilters = (sessionData: SessionData | null) => {
  const [showUserMessages, setShowUserMessages] = useState(true);
  const [showAssistantMessages, setShowAssistantMessages] = useState(true);
  const [showToolCalls, setShowToolCalls] = useState(true);

  const filesOrFoldersCount = useMemo(() => {
    if (!sessionData) return 0;
    return countFilesOrFolders(sessionData.conversation.messages);
  }, [sessionData]);

  const filteredMessages = useMemo(() => {
    if (!sessionData) return [];
    return filterMessages(sessionData.conversation.messages, showUserMessages, showAssistantMessages, showToolCalls);
  }, [sessionData, showUserMessages, showAssistantMessages, showToolCalls]);

  const groupedMessages = useMemo(() => {
    return groupMessagesByType(filteredMessages);
  }, [filteredMessages]);

  return {
    showUserMessages,
    showAssistantMessages,
    showToolCalls,
    setShowUserMessages,
    setShowAssistantMessages,
    setShowToolCalls,
    filesOrFoldersCount,
    groupedMessages
  };
};
