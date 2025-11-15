import * as vscode from 'vscode';
import { CompactService } from '../lib/compact-service.js';
import type { SessionProvider } from '../ui/session-provider.js';
import { SessionTreeItem } from '../ui/tree-items.js';
import { logger } from '../utils/logger.js';

export function registerCompactCommand(
  context: vscode.ExtensionContext,
  sessionProvider: SessionProvider,
  workspacePath: string
): void {
  const compactService = new CompactService();

  const command = vscode.commands.registerCommand('bcc.compactSession', async (item: SessionTreeItem) => {
    if (!item || !(item instanceof SessionTreeItem)) {
      vscode.window.showErrorMessage('Please select a session to compact');
      return;
    }

    try {
      logger.info(`Compacting session ${item.session.id}...`);

      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Compacting session...',
          cancellable: false
        },
        async () => {
          return await compactService.compactSession(item.session.id, workspacePath);
        }
      );

      vscode.window.showInformationMessage(`Session compacted successfully: ${item.session.shortId}`);
      logger.info(`Compact result: ${result}`);

      await sessionProvider.refresh();
    } catch (error) {
      logger.error('Failed to compact session', error as Error);
      vscode.window.showErrorMessage('Failed to compact session. Make sure Claude Code CLI is installed.');
    }
  });

  context.subscriptions.push(command);
}
