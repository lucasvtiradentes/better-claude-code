import * as vscode from 'vscode';
import { sessionCache } from '@/lib/node-utils';
import { CompactService } from '../common/lib/compact-service.js';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';
import { SessionTreeItem } from '../sidebar/tree-items.js';

interface DecorationProvider {
  refresh(): void;
}

export function registerCompactCommand(
  context: vscode.ExtensionContext,
  sessionProvider: SessionProvider,
  decorationProvider: DecorationProvider,
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

      await sessionCache.clear();

      const doc = await vscode.workspace.openTextDocument(result);
      await vscode.window.showTextDocument(doc, { preview: false });

      await sessionProvider.refresh();
      decorationProvider.refresh();
    } catch (error) {
      logger.error('Failed to compact session', error as Error);
      vscode.window.showErrorMessage('Failed to compact session. Make sure BCC CLI is installed.');
    }
  });

  context.subscriptions.push(command);
}
