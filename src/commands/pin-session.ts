import * as vscode from 'vscode';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';
import { SessionTreeItem } from '../sidebar/tree-items.js';

export function registerPinSessionCommand(context: vscode.ExtensionContext, sessionProvider: SessionProvider): void {
  const command = vscode.commands.registerCommand('bcc.togglePinSession', async (item: SessionTreeItem) => {
    if (!item || !(item instanceof SessionTreeItem)) {
      vscode.window.showErrorMessage('Please select a session to pin/unpin');
      return;
    }

    try {
      const isPinned = sessionProvider.togglePinSession(item.session.id);
      const action = isPinned ? 'pinned' : 'unpinned';
      logger.info(`Session ${item.session.shortId} ${action}`);
      vscode.window.showInformationMessage(`Session ${action}: ${item.session.shortId}`);
    } catch (error) {
      logger.error('Failed to toggle pin session', error as Error);
      vscode.window.showErrorMessage('Failed to toggle pin session');
    }
  });

  context.subscriptions.push(command);
}
