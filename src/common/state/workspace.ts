import {
  DEFAULT_MESSAGE_FILTERS_STATE,
  DEFAULT_SESSION_PROVIDER_STATE,
  type GroupBy,
  type MessageFiltersState,
  type SessionProviderState
} from '../schemas/workspace-state.schema';
import { createStateManager, StateKey, type StateManager, StorageType } from './base';

const baseSessionProviderState = createStateManager<SessionProviderState>({
  stateKey: StateKey.SessionProvider,
  defaultState: DEFAULT_SESSION_PROVIDER_STATE,
  storageType: StorageType.Workspace
});

export const sessionProviderState: StateManager<SessionProviderState> & {
  getGroupBy(): GroupBy;
  saveGroupBy(groupBy: GroupBy): void;
  getIsExpanded(): boolean;
  saveIsExpanded(isExpanded: boolean): void;
  getUseSmartExpansion(): boolean;
  saveUseSmartExpansion(useSmartExpansion: boolean): void;
  getExpandedGroups(): string[];
  saveExpandedGroups(expandedGroups: string[]): void;
  getPinnedSessions(): string[];
  savePinnedSessions(pinnedSessions: string[]): void;
  togglePinSession(sessionId: string): boolean;
} = {
  ...baseSessionProviderState,

  getGroupBy(): GroupBy {
    return this.load().groupBy ?? 'date';
  },

  saveGroupBy(groupBy: GroupBy): void {
    const state = this.load();
    state.groupBy = groupBy;
    this.save(state);
  },

  getIsExpanded(): boolean {
    return this.load().isExpanded ?? true;
  },

  saveIsExpanded(isExpanded: boolean): void {
    const state = this.load();
    state.isExpanded = isExpanded;
    this.save(state);
  },

  getUseSmartExpansion(): boolean {
    return this.load().useSmartExpansion ?? true;
  },

  saveUseSmartExpansion(useSmartExpansion: boolean): void {
    const state = this.load();
    state.useSmartExpansion = useSmartExpansion;
    this.save(state);
  },

  getExpandedGroups(): string[] {
    return this.load().expandedGroups ?? [];
  },

  saveExpandedGroups(expandedGroups: string[]): void {
    const state = this.load();
    state.expandedGroups = expandedGroups;
    this.save(state);
  },

  getPinnedSessions(): string[] {
    return this.load().pinnedSessions ?? [];
  },

  savePinnedSessions(pinnedSessions: string[]): void {
    const state = this.load();
    state.pinnedSessions = pinnedSessions;
    this.save(state);
  },

  togglePinSession(sessionId: string): boolean {
    const pinned = this.getPinnedSessions();
    const isPinned = pinned.includes(sessionId);

    if (isPinned) {
      this.savePinnedSessions(pinned.filter((id) => id !== sessionId));
    } else {
      this.savePinnedSessions([...pinned, sessionId]);
    }

    return !isPinned;
  }
};

const baseMessageFiltersState = createStateManager<MessageFiltersState>({
  stateKey: StateKey.MessageFilters,
  defaultState: DEFAULT_MESSAGE_FILTERS_STATE,
  storageType: StorageType.Workspace
});

export const messageFiltersState: StateManager<MessageFiltersState> & {
  getShowUserMessages(): boolean;
  saveShowUserMessages(show: boolean): void;
  getShowAssistantMessages(): boolean;
  saveShowAssistantMessages(show: boolean): void;
  getShowToolCalls(): boolean;
  saveShowToolCalls(show: boolean): void;
} = {
  ...baseMessageFiltersState,

  getShowUserMessages(): boolean {
    return this.load().showUserMessages ?? true;
  },

  saveShowUserMessages(show: boolean): void {
    const state = this.load();
    state.showUserMessages = show;
    this.save(state);
  },

  getShowAssistantMessages(): boolean {
    return this.load().showAssistantMessages ?? true;
  },

  saveShowAssistantMessages(show: boolean): void {
    const state = this.load();
    state.showAssistantMessages = show;
    this.save(state);
  },

  getShowToolCalls(): boolean {
    return this.load().showToolCalls ?? true;
  },

  saveShowToolCalls(show: boolean): void {
    const state = this.load();
    state.showToolCalls = show;
    this.save(state);
  }
};
