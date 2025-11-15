import * as vscode from 'vscode';
import { SessionManager } from '../common/lib/session-manager.js';
import type { FilterCriteria, SessionListItem } from '../common/types.js';
import { logger } from '../common/utils/logger.js';
import { DateGroupTreeItem, SessionTreeItem } from './tree-items.js';

export class SessionProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private sessionManager: SessionManager;
  private currentWorkspacePath: string | null = null;

  constructor() {
    this.sessionManager = new SessionManager();
  }

  async initialize(workspacePath: string): Promise<void> {
    this.currentWorkspacePath = workspacePath;
    await this.refresh();
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

      return dateGroups.map((group) => new DateGroupTreeItem(group, vscode.TreeItemCollapsibleState.Expanded));
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
}
