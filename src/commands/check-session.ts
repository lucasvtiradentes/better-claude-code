import * as vscode from 'vscode';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';
import { SessionTreeItem } from '../sidebar/tree-items.js';

export function registerCheckSessionCommands(context: vscode.ExtensionContext, sessionProvider: SessionProvider): void {
  const toggleCheckCommand = vscode.commands.registerCommand('bcc.toggleCheckSession', (item: SessionTreeItem) => {
    if (!item || !(item instanceof SessionTreeItem)) {
      vscode.window.showErrorMessage('Please select a session to check/uncheck');
      return;
    }

    try {
      const isChecked = sessionProvider.toggleCheckSession(item.session.id);
      const action = isChecked ? 'checked' : 'unchecked';
      logger.info(`Session ${item.session.shortId} ${action}`);

      const checkedCount = sessionProvider.getCheckedSessions().length;
      if (checkedCount > 0) {
        vscode.window.showInformationMessage(`${checkedCount} session(s) checked`);
      }
    } catch (error) {
      logger.error('Failed to toggle check session', error as Error);
      vscode.window.showErrorMessage('Failed to toggle check session');
    }
  });

  const clearAllChecksCommand = vscode.commands.registerCommand('bcc.clearAllChecks', () => {
    const checkedCount = sessionProvider.getCheckedSessions().length;

    if (checkedCount === 0) {
      vscode.window.showInformationMessage('No sessions are checked');
      return;
    }

    try {
      sessionProvider.clearAllChecks();
      logger.info(`Cleared ${checkedCount} checked sessions`);
      vscode.window.showInformationMessage(`Cleared ${checkedCount} checked session(s)`);
    } catch (error) {
      logger.error('Failed to clear checks', error as Error);
      vscode.window.showErrorMessage('Failed to clear checks');
    }
  });

  const batchOperationsMenuCommand = vscode.commands.registerCommand('bcc.batchOperationsMenu', async () => {
    const checkedCount = sessionProvider.getCheckedSessions().length;

    if (checkedCount === 0) {
      vscode.window.showInformationMessage('No sessions checked. Check sessions using the checkbox icon.');
      return;
    }

    const options = [
      {
        label: '$(archive) Compact Sessions',
        description: `Compact ${checkedCount} checked session(s)`,
        command: 'bcc.batchCompact'
      },
      {
        label: '$(trash) Delete Sessions',
        description: `Delete ${checkedCount} checked session(s)`,
        command: 'bcc.batchDelete'
      },
      {
        label: '$(tag) Add Label',
        description: `Add label to ${checkedCount} checked session(s)`,
        command: 'bcc.batchAddLabel'
      },
      {
        label: '$(clear-all) Clear Checks',
        description: `Uncheck all ${checkedCount} session(s)`,
        command: 'bcc.clearAllChecks'
      }
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: `Batch operations for ${checkedCount} checked session(s)`,
      matchOnDescription: true
    });

    if (selected) {
      await vscode.commands.executeCommand(selected.command);
    }
  });

  context.subscriptions.push(toggleCheckCommand);
  context.subscriptions.push(clearAllChecksCommand);
  context.subscriptions.push(batchOperationsMenuCommand);
}
