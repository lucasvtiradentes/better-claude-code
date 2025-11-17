import type * as vscode from 'vscode';
import { logger } from '../common/utils/logger.js';

interface SessionProviderState {
  groupBy: 'date' | 'token-percentage' | 'label';
  isExpanded: boolean;
  useSmartExpansion: boolean;
  expandedGroups: string[];
}

interface MessageFiltersState {
  showUserMessages: boolean;
  showAssistantMessages: boolean;
  showToolCalls: boolean;
}

const KEYS = {
  SESSION_PROVIDER: 'sessionProviderState',
  MESSAGE_FILTERS: 'messageFiltersState'
} as const;

export class WorkspaceState {
  constructor(private context: vscode.ExtensionContext) {}

  getSessionProviderState(): SessionProviderState | null {
    const state = this.context.workspaceState.get<SessionProviderState>(KEYS.SESSION_PROVIDER);
    if (state) {
      logger.info(
        `[WorkspaceState] Load sessionProvider: groupBy=${state.groupBy}, isExpanded=${state.isExpanded}, useSmartExpansion=${state.useSmartExpansion}, expandedGroups=${state.expandedGroups?.join(', ') || 'none'}`
      );
      return state;
    }
    logger.info('[WorkspaceState] No sessionProvider state found, using defaults');
    return null;
  }

  setSessionProviderState(state: SessionProviderState): void {
    this.context.workspaceState.update(KEYS.SESSION_PROVIDER, state);
    logger.info(
      `[WorkspaceState] Save sessionProvider: groupBy=${state.groupBy}, isExpanded=${state.isExpanded}, useSmartExpansion=${state.useSmartExpansion}, expandedGroups=${state.expandedGroups.join(', ') || 'none'}`
    );
  }

  getMessageFiltersState(): MessageFiltersState {
    const state = this.context.workspaceState.get<MessageFiltersState>(KEYS.MESSAGE_FILTERS);
    if (state) {
      logger.info(`[WorkspaceState] Load messageFilters: ${JSON.stringify(state)}`);
      return state;
    }
    logger.info('[WorkspaceState] No messageFilters state found, using defaults');
    return {
      showUserMessages: true,
      showAssistantMessages: true,
      showToolCalls: true
    };
  }

  setMessageFiltersState(state: MessageFiltersState): void {
    this.context.workspaceState.update(KEYS.MESSAGE_FILTERS, state);
    logger.info(`[WorkspaceState] Save messageFilters: ${JSON.stringify(state)}`);
  }
}
