import * as vscode from 'vscode';
import { ClaudeHelper, getCompactionSummaryPath } from '@/lib/node-utils';
import { logger } from '../common/utils/logger.js';
import { SessionTreeItem } from '../sidebar/tree-items.js';

export function registerViewCompactionCommand(context: vscode.ExtensionContext, workspacePath: string): void {
  const command = vscode.commands.registerCommand('bcc.viewCompaction', async (item: SessionTreeItem) => {
    if (!item || !(item instanceof SessionTreeItem)) {
      vscode.window.showErrorMessage('Please select a session to view compaction');
      return;
    }

    if (!item.session.hasCompaction) {
      vscode.window.showErrorMessage('This session does not have a compaction available');
      return;
    }

    try {
      const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(workspacePath);
      const summaryPath = getCompactionSummaryPath(normalizedPath, item.session.id);

      logger.info(`Opening compaction summary: ${summaryPath}`);

      const uri = vscode.Uri.file(summaryPath);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, {
        preview: false,
        viewColumn: vscode.ViewColumn.Active
      });
    } catch (error) {
      logger.error('Failed to open compaction summary', error as Error);
      vscode.window.showErrorMessage('Failed to open compaction summary');
    }
  });

  context.subscriptions.push(command);
}
