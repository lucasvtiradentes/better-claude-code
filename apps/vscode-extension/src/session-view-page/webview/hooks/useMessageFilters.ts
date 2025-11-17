import { useEffect, useMemo, useRef, useState } from 'react';
import type { SessionData } from '../types';
import { countFilesOrFolders, filterMessages, groupMessagesByType } from '../utils/message-filters';
import { vscode } from '../utils/vscode';

export const useMessageFilters = (sessionData: SessionData | null) => {
  const hasReceivedFilters = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no-exp
  const initialState = useMemo(() => {
    if (sessionData?.filters) {
      console.log('[useMessageFilters] Initializing with filters from sessionData:', sessionData.filters);
      hasReceivedFilters.current = true;
      return sessionData.filters;
    }
    console.log('[useMessageFilters] No initial filters, waiting for data');
    return null;
  }, []);

  const [showUserMessages, setShowUserMessages] = useState(initialState?.showUserMessages ?? true);
  const [showAssistantMessages, setShowAssistantMessages] = useState(initialState?.showAssistantMessages ?? true);
  const [showToolCalls, setShowToolCalls] = useState(initialState?.showToolCalls ?? true);

  useEffect(() => {
    if (sessionData?.filters) {
      if (!hasReceivedFilters.current) {
        console.log('[useMessageFilters] Received filters from extension:', sessionData.filters);
        setShowUserMessages(sessionData.filters.showUserMessages);
        setShowAssistantMessages(sessionData.filters.showAssistantMessages);
        setShowToolCalls(sessionData.filters.showToolCalls);
        hasReceivedFilters.current = true;
      }
      setIsLoading(false);
    }
  }, [sessionData]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'filtersUpdated') {
        console.log('[useMessageFilters] Received broadcast filters update:', message.filters);
        setShowUserMessages(message.filters.showUserMessages);
        setShowAssistantMessages(message.filters.showAssistantMessages);
        setShowToolCalls(message.filters.showToolCalls);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!hasReceivedFilters.current) {
      console.log('[useMessageFilters] Skipping saveFilters - not initialized yet');
      return;
    }

    const filters = { showUserMessages, showAssistantMessages, showToolCalls };
    console.log('[useMessageFilters] Sending saveFilters to extension:', filters);
    vscode.postMessage({
      type: 'saveFilters',
      filters
    });
  }, [showUserMessages, showAssistantMessages, showToolCalls]);

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
    groupedMessages,
    isLoading
  };
};
