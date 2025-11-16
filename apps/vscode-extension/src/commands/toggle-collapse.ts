import * as vscode from 'vscode';
import type { SessionProvider } from '../sidebar/session-provider.js';

export function registerToggleCollapseCommand(context: vscode.ExtensionContext, sessionProvider: SessionProvider) {
  const toggleCollapseCommand = vscode.commands.registerCommand('bcc.toggleCollapseExpand', () => {
    sessionProvider.toggleCollapseExpand();
  });

  context.subscriptions.push(toggleCollapseCommand);
}
