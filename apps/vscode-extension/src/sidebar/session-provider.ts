import * as vscode from 'vscode';
import { SessionManager } from '../common/lib/session-manager.js';
import type { FilterCriteria, SessionListItem } from '../common/types.js';
import { logger } from '../common/utils/logger.js';
import { WorkspaceState } from '../storage/workspace-state.js';
import { DateGroupTreeItem, SessionTreeItem } from './tree-items.js';

function normalizeGroupLabel(label: string): string {
  return label.replace(/\s*\(\d+\)$/, '');
}

export class SessionProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private sessionManager: SessionManager;
  private currentWorkspacePath: string | null = null;
  private isExpanded: boolean = true;
  private useSmartExpansion: boolean = true;
  private expandedGroups: Set<string> = new Set();
  private itemIdCounter: number = 0;
  private workspaceState: WorkspaceState | null = null;

  constructor() {
    this.sessionManager = new SessionManager();
  }

  async initialize(workspacePath: string, context: vscode.ExtensionContext): Promise<void> {
    this.currentWorkspacePath = workspacePath;
    this.workspaceState = new WorkspaceState(context);
    this.loadState();
    await this.refresh();
  }

  private loadState(): void {
    if (!this.workspaceState) return;

    const state = this.workspaceState.getSessionProviderState();
    if (state) {
      this.sessionManager.setGroupBy(state.groupBy);
      this.isExpanded = state.isExpanded;
      this.useSmartExpansion = state.useSmartExpansion ?? true;
      this.expandedGroups = new Set(state.expandedGroups || []);
    }
  }

  private saveState(): void {
    if (!this.workspaceState) return;

    this.workspaceState.setSessionProviderState({
      groupBy: this.sessionManager.getGroupBy(),
      isExpanded: this.isExpanded,
      useSmartExpansion: this.useSmartExpansion,
      expandedGroups: Array.from(this.expandedGroups)
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
      vscode.window.showErrorMessage('Failed to load Claude Code sessions');
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

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
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

        const collapsibleState: vscode.TreeItemCollapsibleState = isExpanded
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed;

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
      const { WebviewProvider } = await import('../session-view-page/webview-provider.js');
      const openSessionIds = new Set(WebviewProvider.getOpenSessionIds());

      return element.dateGroup.sessions.map(
        (session) => new SessionTreeItem(session, vscode.TreeItemCollapsibleState.None, openSessionIds.has(session.id))
      );
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
    this.isExpanded = !this.isExpanded;
    this.useSmartExpansion = false;
    logger.info(
      `Toggle collapse/expand - new state: ${this.isExpanded ? 'EXPANDED' : 'COLLAPSED'}, disabled smart expansion`
    );
    this.saveState();
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

  async getParsedSessionPath(sessionId: string): Promise<string | null> {
    return await this.sessionManager.getParsedSessionPath(sessionId);
  }

  async getSummaryPath(sessionId: string): Promise<string | null> {
    return await this.sessionManager.getSummaryPath(sessionId);
  }
}
