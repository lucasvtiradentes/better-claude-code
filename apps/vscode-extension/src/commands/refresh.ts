import * as vscode from 'vscode';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';

interface DecorationProvider {
  refresh(): void;
}

export function registerRefreshCommand(
  context: vscode.ExtensionContext,
  sessionProvider: SessionProvider,
  decorationProvider: DecorationProvider
): void {
  const command = vscode.commands.registerCommand('bcc.refreshSessions', async () => {
    try {
      logger.info('Refreshing sessions...');
      await sessionProvider.refresh();
      decorationProvider.refresh();
      vscode.window.showInformationMessage('Sessions refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh sessions', error as Error);
      vscode.window.showErrorMessage('Failed to refresh sessions');
    }
  });

  context.subscriptions.push(command);
}
