import type { SessionListItem } from '@/lib/node-utils';
import { SessionManager } from '../../common/lib/session-manager.js';
import { sessionProviderState } from '../../common/state';
import type { FilterCriteria } from '../../common/types.js';
import { logger } from '../../common/utils/logger.js';
import { ContextKey, setContextKey } from '../../common/vscode/vscode-commands';
import { VscodeConstants } from '../../common/vscode/vscode-constants';
import { ToastKind, VscodeHelper } from '../../common/vscode/vscode-helper';
import {
  EventEmitterClass,
  type ExtensionContext,
  type TreeDataProvider,
  type TreeItem,
  type TreeItemCollapsibleState
} from '../../common/vscode/vscode-types';
import { WebviewProvider } from '../../session-view-page/webview-provider.js';
import { DateGroupTreeItem, SessionTreeItem } from './tree-items.js';

function normalizeGroupLabel(label: string): string {
  return label.replace(/\s*\(\d+\)$/, '');
}

export class SessionProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new EventEmitterClass<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private sessionManager: SessionManager;
  private currentWorkspacePath: string | null = null;
  private isExpanded: boolean = true;
  private useSmartExpansion: boolean = true;
  private expandedGroups: Set<string> = new Set();
  private itemIdCounter: number = 0;
  private checkedSessions: Set<string> = new Set();

  constructor() {
    this.sessionManager = new SessionManager();
  }

  async initialize(workspacePath: string, _context: ExtensionContext): Promise<void> {
    this.currentWorkspacePath = workspacePath;
    this.loadState();
    this.updateContextKeys();
    await this.refresh();
  }

  private loadState(): void {
    const state = sessionProviderState.load();
    this.sessionManager.setGroupBy(state.groupBy);
    this.isExpanded = state.isExpanded;
    this.useSmartExpansion = state.useSmartExpansion ?? true;
    this.expandedGroups = new Set(state.expandedGroups || []);
  }

  private saveState(): void {
    sessionProviderState.save({
      groupBy: this.sessionManager.getGroupBy(),
      isExpanded: this.isExpanded,
      useSmartExpansion: this.useSmartExpansion,
      expandedGroups: Array.from(this.expandedGroups),
      pinnedSessions: sessionProviderState.getPinnedSessions()
    });
  }

  async refresh(): Promise<void> {
    if (!this.currentWorkspacePath) {
      logger.info('No workspace path set, skipping refresh');
      return;
    }

    try {
      await this.sessionManager.loadSessions(this.currentWorkspacePath);
      this._onDidChangeTreeData.fire();
    } catch (error) {
      logger.error('Failed to refresh sessions', error as Error);
      VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to load Claude Code sessions');
    }
  }

  setFilter(filter: FilterCriteria): void {
    this.sessionManager.setFilter(filter);
    this._onDidChangeTreeData.fire();
  }

  setGroupBy(groupBy: 'date' | 'token-percentage' | 'label'): void {
    this.sessionManager.setGroupBy(groupBy);
    this.saveState();
    this._onDidChangeTreeData.fire();
  }

  getGroupBy(): 'date' | 'token-percentage' | 'label' {
    return this.sessionManager.getGroupBy();
  }

  updateSessionLabels(sessionId: string, labels: string[]): void {
    this.sessionManager.updateSessionLabels(sessionId, labels);
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!this.currentWorkspacePath) {
      return [];
    }

    if (!element) {
      const filteredSessions = this.sessionManager.getFilteredSessions();
      const dateGroups = this.sessionManager.groupByDate(filteredSessions);

      this.itemIdCounter++;

      if (this.useSmartExpansion && this.expandedGroups.size === 0 && this.sessionManager.getGroupBy() === 'date') {
        logger.info('Initializing expandedGroups from smart expansion');
        dateGroups.forEach((group) => {
          const groupLabel = group.label;
          const normalizedLabel = normalizeGroupLabel(groupLabel);
          const isRecentGroup =
            normalizedLabel.toLowerCase().includes('last hour') || normalizedLabel.toLowerCase().includes('today');
          if (isRecentGroup) {
            this.expandedGroups.add(normalizedLabel);
            logger.info(`  - Adding "${normalizedLabel}" to expandedGroups (smart init)`);
          }
        });
      }

      const items = dateGroups.map((group, index) => {
        const groupLabel = group.label;
        const normalizedLabel = normalizeGroupLabel(groupLabel);
        const isExpanded = this.expandedGroups.has(normalizedLabel);

        const collapsibleState: TreeItemCollapsibleState = isExpanded
          ? VscodeConstants.TreeItemCollapsibleState.Expanded
          : VscodeConstants.TreeItemCollapsibleState.Collapsed;

        const item = new DateGroupTreeItem(group, collapsibleState);
        item.id = `date-group-${this.itemIdCounter}-${index}`;
        return item;
      });

      logger.info(
        `getChildren: created ${items.length} groups, mode=${this.useSmartExpansion ? 'SMART' : 'MANUAL'}, expandedGroups=[${Array.from(this.expandedGroups).join(', ')}], counter=${this.itemIdCounter}`
      );
      return items;
    }

    if (element instanceof DateGroupTreeItem) {
      const openSessionIds = new Set(WebviewProvider.getOpenSessionIds());
      const pinnedIds = sessionProviderState.getPinnedSessions();

      const pinnedSessions = element.dateGroup.sessions
        .filter((s) => pinnedIds.includes(s.id))
        .map(
          (session) =>
            new SessionTreeItem(
              session,
              VscodeConstants.TreeItemCollapsibleState.None,
              openSessionIds.has(session.id),
              true,
              this.checkedSessions.has(session.id)
            )
        );

      const unpinnedSessions = element.dateGroup.sessions
        .filter((s) => !pinnedIds.includes(s.id))
        .map(
          (session) =>
            new SessionTreeItem(
              session,
              VscodeConstants.TreeItemCollapsibleState.None,
              openSessionIds.has(session.id),
              false,
              this.checkedSessions.has(session.id)
            )
        );

      return [...pinnedSessions, ...unpinnedSessions];
    }

    return [];
  }

  getStats() {
    const filteredSessions = this.sessionManager.getFilteredSessions();
    return this.sessionManager.getStats(filteredSessions);
  }

  getSession(sessionId: string): SessionListItem | undefined {
    const filteredSessions = this.sessionManager.getFilteredSessions();
    return filteredSessions.find((s) => s.id === sessionId);
  }

  async getSessionConversation(session: SessionListItem) {
    return this.sessionManager.getSessionConversation(session);
  }

  toggleCollapseExpand(): void {
    const filteredSessions = this.sessionManager.getFilteredSessions();
    const dateGroups = this.sessionManager.groupByDate(filteredSessions);

    const totalGroups = dateGroups.length;
    const expandedCount = this.expandedGroups.size;
    const currentlyMostlyExpanded = expandedCount > totalGroups / 2;

    this.useSmartExpansion = false;

    logger.info(
      `Toggle collapse/expand - BEFORE: totalGroups=${totalGroups}, expandedCount=${expandedCount}, currentlyMostlyExpanded=${currentlyMostlyExpanded}, isExpanded=${this.isExpanded}`
    );

    if (currentlyMostlyExpanded) {
      this.expandedGroups.clear();
      this.isExpanded = false;
      logger.info('  Action: COLLAPSING all groups');
    } else {
      dateGroups.forEach((group) => {
        const normalizedLabel = normalizeGroupLabel(group.label);
        this.expandedGroups.add(normalizedLabel);
      });
      this.isExpanded = true;
      logger.info('  Action: EXPANDING all groups');
    }

    logger.info(
      `Toggle collapse/expand - AFTER: isExpanded=${this.isExpanded}, expandedGroups=[${Array.from(this.expandedGroups).join(', ')}]`
    );
    this.saveState();
    this.updateContextKeys();
    this._onDidChangeTreeData.fire();
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }

  onGroupExpanded(element: DateGroupTreeItem): void {
    const groupLabel = element.dateGroup.label;
    const normalizedLabel = normalizeGroupLabel(groupLabel);
    const wasInSet = this.expandedGroups.has(normalizedLabel);
    this.expandedGroups.add(normalizedLabel);
    this.useSmartExpansion = false;
    logger.info(
      `Group expanded by user: "${groupLabel}" -> normalized: "${normalizedLabel}" (was in set: ${wasInSet}, total: ${this.expandedGroups.size})`
    );
    logger.info(`  Current expandedGroups: [${Array.from(this.expandedGroups).join(', ')}]`);
    this.saveState();
  }

  onGroupCollapsed(element: DateGroupTreeItem): void {
    const groupLabel = element.dateGroup.label;
    const normalizedLabel = normalizeGroupLabel(groupLabel);
    const wasInSet = this.expandedGroups.has(normalizedLabel);
    this.expandedGroups.delete(normalizedLabel);
    this.useSmartExpansion = false;
    logger.info(
      `Group collapsed by user: "${groupLabel}" -> normalized: "${normalizedLabel}" (was in set: ${wasInSet}, total: ${this.expandedGroups.size})`
    );
    logger.info(`  Current expandedGroups: [${Array.from(this.expandedGroups).join(', ')}]`);
    this.saveState();
  }

  getSessionPath(sessionId: string): string | null {
    return this.sessionManager.getSessionPath(sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionManager.deleteSession(sessionId);
    await this.refresh();
  }

  async compactSession(sessionId: string): Promise<string> {
    if (!this.currentWorkspacePath) {
      throw new Error('No workspace path set');
    }
    const summaryPath = await this.sessionManager.compactSession(sessionId, this.currentWorkspacePath);
    await this.refresh();
    return summaryPath;
  }

  getParsedSessionPath(sessionId: string): Promise<string | null> {
    return this.sessionManager.getParsedSessionPath(sessionId);
  }

  getSummaryPath(sessionId: string): Promise<string | null> {
    return this.sessionManager.getSummaryPath(sessionId);
  }

  togglePinSession(sessionId: string): boolean {
    const isPinned = sessionProviderState.togglePinSession(sessionId);
    this._onDidChangeTreeData.fire();
    return isPinned;
  }

  isPinned(sessionId: string): boolean {
    return sessionProviderState.getPinnedSessions().includes(sessionId);
  }

  toggleCheckSession(sessionId: string): boolean {
    const isChecked = this.checkedSessions.has(sessionId);
    if (isChecked) {
      this.checkedSessions.delete(sessionId);
    } else {
      this.checkedSessions.add(sessionId);
    }
    this.updateContextKeys();
    this._onDidChangeTreeData.fire();
    return !isChecked;
  }

  isChecked(sessionId: string): boolean {
    return this.checkedSessions.has(sessionId);
  }

  getCheckedSessions(): string[] {
    return Array.from(this.checkedSessions);
  }

  clearAllChecks(): void {
    this.checkedSessions.clear();
    this.updateContextKeys();
    this._onDidChangeTreeData.fire();
  }

  hasCheckedSessions(): boolean {
    return this.checkedSessions.size > 0;
  }

  private updateContextKeys(): void {
    setContextKey(ContextKey.HasCheckedSessions, this.hasCheckedSessions());
  }
}
