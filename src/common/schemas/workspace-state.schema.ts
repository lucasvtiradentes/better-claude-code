export type GroupBy = 'date' | 'token-percentage' | 'label';

export type SessionProviderState = {
  groupBy: GroupBy;
  isExpanded: boolean;
  useSmartExpansion: boolean;
  expandedGroups: string[];
  pinnedSessions?: string[];
};

export type MessageFiltersState = {
  showUserMessages: boolean;
  showAssistantMessages: boolean;
  showToolCalls: boolean;
};

export type WorkspaceUIState = {
  sessionProvider?: SessionProviderState;
  messageFilters?: MessageFiltersState;
};

export const DEFAULT_SESSION_PROVIDER_STATE: SessionProviderState = {
  groupBy: 'date',
  isExpanded: true,
  useSmartExpansion: true,
  expandedGroups: [],
  pinnedSessions: []
};

export const DEFAULT_MESSAGE_FILTERS_STATE: MessageFiltersState = {
  showUserMessages: true,
  showAssistantMessages: true,
  showToolCalls: true
};
