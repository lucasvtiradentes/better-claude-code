import { Command, getCommandId } from '../common/vscode/vscode-commands';
import { VscodeConstants } from '../common/vscode/vscode-constants';
import { VscodeHelper } from '../common/vscode/vscode-helper';
import type { Disposable, StatusBarItem } from '../common/vscode/vscode-types';
import type { SessionProvider } from '../views/sessions/session-provider';

export class StatusBarManager {
  private statusBarItem: StatusBarItem;

  constructor(private sessionProvider: SessionProvider) {
    this.statusBarItem = VscodeHelper.createStatusBarItem(VscodeConstants.StatusBarAlignment.Left, 100);
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

  getDisposable(): Disposable {
    return this.statusBarItem;
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
