import * as vscode from 'vscode';
import {
  ClaudeHelper,
  getSessionLabels,
  getSessionLabelsForSession,
  sessionCache,
  toggleSessionLabel
} from '@/lib/node-utils';
import { CompactService } from '../common/lib/compact-service.js';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';
import { SessionTreeItem } from '../sidebar/tree-items.js';

interface DecorationProvider {
  refresh(): void;
}

export function registerBatchOperationsCommands(
  context: vscode.ExtensionContext,
  sessionProvider: SessionProvider,
  decorationProvider: DecorationProvider,
  workspacePath: string
): void {
  const compactService = new CompactService();

  const batchCompactCommand = vscode.commands.registerCommand('bcc.batchCompact', async () => {
    const checkedSessionIds = sessionProvider.getCheckedSessions();

    if (checkedSessionIds.length === 0) {
      vscode.window.showInformationMessage('No sessions checked. Check sessions using the checkbox icon.');
      return;
    }

    const selection = checkedSessionIds
      .map((id) => {
        const session = sessionProvider.getSession(id);
        if (!session) return null;
        return new SessionTreeItem(session, vscode.TreeItemCollapsibleState.None);
      })
      .filter((item): item is SessionTreeItem => item !== null);

    const confirm = await vscode.window.showWarningMessage(
      `Compact ${selection.length} session(s)?`,
      { modal: true },
      'Compact All'
    );

    if (confirm !== 'Compact All') {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Compacting ${selection.length} sessions...`,
        cancellable: false
      },
      async (progress) => {
        for (let i = 0; i < selection.length; i++) {
          const item = selection[i];
          progress.report({
            message: `${i + 1}/${selection.length}: ${item.session.shortId}`,
            increment: 100 / selection.length
          });

          try {
            await compactService.compactSession(item.session.id, workspacePath);
            successCount++;
            logger.info(`Batch compact: ${item.session.shortId} success`);
          } catch (error) {
            errorCount++;
            logger.error(`Batch compact: ${item.session.shortId} failed`, error as Error);
          }
        }
      }
    );

    await sessionCache.clear();
    sessionProvider.clearAllChecks();
    await sessionProvider.refresh();
    decorationProvider.refresh();

    if (errorCount === 0) {
      vscode.window.showInformationMessage(`Successfully compacted ${successCount} session(s)`);
    } else {
      vscode.window.showWarningMessage(
        `Compacted ${successCount} session(s), ${errorCount} failed. Check logs for details.`
      );
    }
  });

  const batchDeleteCommand = vscode.commands.registerCommand('bcc.batchDelete', async () => {
    const checkedSessionIds = sessionProvider.getCheckedSessions();

    if (checkedSessionIds.length === 0) {
      vscode.window.showInformationMessage('No sessions checked. Check sessions using the checkbox icon.');
      return;
    }

    const selection = checkedSessionIds
      .map((id) => {
        const session = sessionProvider.getSession(id);
        if (!session) return null;
        return new SessionTreeItem(session, vscode.TreeItemCollapsibleState.None);
      })
      .filter((item): item is SessionTreeItem => item !== null);

    const confirm = await vscode.window.showWarningMessage(
      `Delete ${selection.length} session(s)? This will also delete any compaction files.`,
      { modal: true },
      'Delete All'
    );

    if (confirm !== 'Delete All') {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Deleting ${selection.length} sessions...`,
        cancellable: false
      },
      async (progress) => {
        for (let i = 0; i < selection.length; i++) {
          const item = selection[i];
          progress.report({
            message: `${i + 1}/${selection.length}: ${item.session.shortId}`,
            increment: 100 / selection.length
          });

          try {
            await sessionProvider.deleteSession(item.session.id);
            successCount++;
            logger.info(`Batch delete: ${item.session.shortId} success`);
          } catch (error) {
            errorCount++;
            logger.error(`Batch delete: ${item.session.shortId} failed`, error as Error);
          }
        }
      }
    );

    sessionProvider.clearAllChecks();
    await sessionProvider.refresh();

    if (errorCount === 0) {
      vscode.window.showInformationMessage(`Successfully deleted ${successCount} session(s)`);
    } else {
      vscode.window.showWarningMessage(
        `Deleted ${successCount} session(s), ${errorCount} failed. Check logs for details.`
      );
    }
  });

  const batchAddLabelCommand = vscode.commands.registerCommand('bcc.batchAddLabel', async () => {
    const checkedSessionIds = sessionProvider.getCheckedSessions();

    if (checkedSessionIds.length === 0) {
      vscode.window.showInformationMessage('No sessions checked. Check sessions using the checkbox icon.');
      return;
    }

    try {
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspacePath) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }

      const projectName = ClaudeHelper.normalizePathForClaudeProjects(workspacePath);

      logger.info(`Batch add label: workspacePath=${workspacePath}`);
      logger.info(`Batch add label: projectName=${projectName}`);

      const allLabels = getSessionLabels();
      logger.info(`Batch add label: Found ${allLabels.length} labels`);

      if (allLabels.length === 0) {
        vscode.window.showInformationMessage(
          'No labels available. Create labels first using the individual session label command.'
        );
        return;
      }

      const labelOptions = allLabels.map((label) => ({
        label: label.name,
        description: label.color,
        value: label.id
      }));

      const selection = await vscode.window.showQuickPick(labelOptions, {
        placeHolder: `Select a label to add to ${checkedSessionIds.length} session(s)`,
        matchOnDescription: false
      });

      if (!selection) {
        return;
      }

      let successCount = 0;

      for (const sessionId of checkedSessionIds) {
        try {
          const session = sessionProvider.getSession(sessionId);
          if (!session) {
            logger.error(`Batch add label: Session ${sessionId} not found`);
            continue;
          }

          logger.info(`Batch add label: Processing session ${session.id} (${session.shortId})`);

          const currentLabels = getSessionLabelsForSession(projectName, session.id);
          logger.info(`Batch add label: Session ${session.shortId} current labels: ${currentLabels.join(', ')}`);

          const updatedLabels = toggleSessionLabel(projectName, session.id, selection.value);
          logger.info(`Batch add label: Session ${session.shortId} updated labels: ${updatedLabels.join(', ')}`);

          sessionProvider.updateSessionLabels(session.id, updatedLabels);
          successCount++;
        } catch (error) {
          logger.error(`Batch add label: ${sessionId} failed`, error as Error);
        }
      }

      sessionProvider.clearAllChecks();

      vscode.window.showInformationMessage(`Toggled label "${selection.label}" for ${successCount} session(s)`);
    } catch (error) {
      logger.error('Batch add label failed', error as Error);
      vscode.window.showErrorMessage('Failed to add label to sessions');
    }
  });

  context.subscriptions.push(batchCompactCommand);
  context.subscriptions.push(batchDeleteCommand);
  context.subscriptions.push(batchAddLabelCommand);
}
