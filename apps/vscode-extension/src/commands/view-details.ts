import * as vscode from 'vscode';
import type { SessionListItem } from '../types.js';
import { SessionTreeItem } from '../ui/tree-items.js';
import { WebviewProvider } from '../ui/webview-provider.js';
import { logger } from '../utils/logger.js';

export function registerViewDetailsCommand(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand(
    'bcc.viewSessionDetails',
    (itemOrSession: SessionTreeItem | SessionListItem) => {
      try {
        const session = itemOrSession instanceof SessionTreeItem ? itemOrSession.session : itemOrSession;

        logger.info(`Viewing details for session ${session.id}`);
        WebviewProvider.showSessionDetails(context, session);
      } catch (error) {
        logger.error('Failed to view session details', error as Error);
        vscode.window.showErrorMessage('Failed to view session details');
      }
    }
  );

  context.subscriptions.push(command);
}
