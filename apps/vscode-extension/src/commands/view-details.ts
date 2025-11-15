import * as vscode from 'vscode';
import type { SessionListItem } from '../types.js';
import { SessionTreeItem } from '../ui/tree-items.js';
import { WebviewProvider } from '../ui/webview-provider.js';
import type { SessionProvider } from '../ui/session-provider.js';
import { logger } from '../utils/logger.js';

export function registerViewDetailsCommand(context: vscode.ExtensionContext, sessionProvider: SessionProvider): void {
  const command = vscode.commands.registerCommand(
    'bcc.viewSessionDetails',
    async (itemOrSession: SessionTreeItem | SessionListItem) => {
      try {
        const session = itemOrSession instanceof SessionTreeItem ? itemOrSession.session : itemOrSession;

        logger.info(`Viewing conversation for session ${session.id}`);
        await WebviewProvider.showSessionConversation(context, session, sessionProvider);
      } catch (error) {
        logger.error('Failed to view session conversation', error as Error);
        vscode.window.showErrorMessage('Failed to view session conversation');
      }
    }
  );

  context.subscriptions.push(command);
}
