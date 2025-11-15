import * as vscode from 'vscode';
import { logger } from '../common/utils/logger.js';
import { SessionTreeItem } from '../sidebar/tree-items.js';

export function registerFileOperationsCommands(context: vscode.ExtensionContext): void {
  const openSessionFileCommand = vscode.commands.registerCommand(
    'bcc.openSessionFile',
    async (item: SessionTreeItem) => {
      if (!item || !(item instanceof SessionTreeItem)) {
        vscode.window.showErrorMessage('Please select a session');
        return;
      }

      if (!item.session.filePath) {
        vscode.window.showErrorMessage('Session file path not available');
        return;
      }

      try {
        const document = await vscode.workspace.openTextDocument(item.session.filePath);
        await vscode.window.showTextDocument(document);
        logger.info(`Opened session file: ${item.session.filePath}`);
      } catch (error) {
        logger.error('Failed to open session file', error as Error);
        vscode.window.showErrorMessage('Failed to open session file');
      }
    }
  );

  const copySessionPathCommand = vscode.commands.registerCommand(
    'bcc.copySessionPath',
    async (item: SessionTreeItem) => {
      if (!item || !(item instanceof SessionTreeItem)) {
        vscode.window.showErrorMessage('Please select a session');
        return;
      }

      if (!item.session.filePath) {
        vscode.window.showErrorMessage('Session file path not available');
        return;
      }

      try {
        await vscode.env.clipboard.writeText(item.session.filePath);
        vscode.window.showInformationMessage('Session path copied to clipboard');
        logger.info(`Copied session path: ${item.session.filePath}`);
      } catch (error) {
        logger.error('Failed to copy session path', error as Error);
        vscode.window.showErrorMessage('Failed to copy session path');
      }
    }
  );

  context.subscriptions.push(openSessionFileCommand, copySessionPathCommand);
}
