import * as vscode from 'vscode';
import { Command, getCommandId } from '../common/vscode/vscode-commands';
import type { SessionProvider } from '../sidebar/session-provider.js';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor(private sessionProvider: SessionProvider) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = getCommandId(Command.OpenSettingsMenu);
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

    const tooltipContent = [
      `Total Sessions: ${stats.totalSessions}`,
      `Today: ${stats.todayCount}`,
      `Total Token Usage: ${stats.totalTokens}%`,
      `Click to refresh`
    ];
    this.statusBarItem.tooltip = tooltipContent.join('\n');

    this.statusBarItem.show();
  }

  getDisposable(): vscode.Disposable {
    return this.statusBarItem;
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
