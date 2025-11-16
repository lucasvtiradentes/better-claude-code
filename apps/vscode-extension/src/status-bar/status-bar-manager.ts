import * as vscode from 'vscode';
import type { SessionProvider } from '../sidebar/session-provider.js';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor(private sessionProvider: SessionProvider) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = 'bcc.refreshSessions';
  }

  update(): void {
    if (!this.sessionProvider) {
      return;
    }

    const stats = this.sessionProvider.getStats();

    this.statusBarItem.text = `$(file-text) BCC: ${stats.totalSessions} sessions`;

    if (stats.todayCount > 0) {
      this.statusBarItem.text += ` (${stats.todayCount} today)`;
    }

    this.statusBarItem.tooltip = `Total Sessions: ${stats.totalSessions}\nToday: ${stats.todayCount}\nTotal Token Usage: ${stats.totalTokens}%\n\nClick to refresh`;

    this.statusBarItem.show();
  }

  getDisposable(): vscode.Disposable {
    return this.statusBarItem;
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
