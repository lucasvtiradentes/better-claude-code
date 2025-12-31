import * as vscode from 'vscode';
import type { SessionListItem } from '@/lib/node-utils';
import { logger } from '../common/utils/logger.js';
import { WebviewProvider } from '../session-view-page/webview-provider.js';
import type { SessionProvider } from '../sidebar/session-provider.js';
import { SessionTreeItem } from '../sidebar/tree-items.js';

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
