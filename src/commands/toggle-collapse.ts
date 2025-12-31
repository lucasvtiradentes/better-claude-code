import * as vscode from 'vscode';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';

export function registerToggleCollapseCommand(context: vscode.ExtensionContext, sessionProvider: SessionProvider) {
  const toggleCollapseCommand = vscode.commands.registerCommand('bcc.toggleCollapseExpand', () => {
    logger.info('Toggle collapse/expand command triggered');
    sessionProvider.toggleCollapseExpand();
  });

  context.subscriptions.push(toggleCollapseCommand);
}
