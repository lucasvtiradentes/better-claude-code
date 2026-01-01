import {
  ClaudeHelper,
  getSessionLabels,
  getSessionLabelsForSession,
  sessionCache,
  toggleSessionLabel
} from '@/lib/node-utils';
import { logger } from '../../../common/utils/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { VscodeConstants } from '../../../common/vscode/vscode-constants';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { Disposable } from '../../../common/vscode/vscode-types';
import { CompactService } from '../../../views/sessions/compact-service';
import type { SessionProvider } from '../../../views/sessions/session-provider';
import { SessionTreeItem } from '../../../views/sessions/tree-items';

type DecorationProvider = {
  refresh(): void;
};

async function handleBatchCompact(
  sessionProvider: SessionProvider,
  decorationProvider: DecorationProvider,
  workspacePath: string,
  compactService: CompactService
) {
  const checkedSessionIds = sessionProvider.getCheckedSessions();

  if (checkedSessionIds.length === 0) {
    VscodeHelper.showToastMessage(ToastKind.Info, 'No sessions checked. Check sessions using the checkbox icon.');
    return;
  }

  const selection = checkedSessionIds
    .map((id) => {
      const session = sessionProvider.getSession(id);
      if (!session) return null;
      return new SessionTreeItem(session, VscodeConstants.TreeItemCollapsibleState.None);
    })
    .filter((item): item is SessionTreeItem => item !== null);

  const confirm = await VscodeHelper.showWarningMessage(
    `Compact ${selection.length} session(s)?`,
    { modal: true },
    'Compact All'
  );

  if (confirm !== 'Compact All') {
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  await VscodeHelper.withProgress(
    {
      location: VscodeConstants.ProgressLocation.Notification,
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
    VscodeHelper.showToastMessage(ToastKind.Info, `Successfully compacted ${successCount} session(s)`);
  } else {
    VscodeHelper.showToastMessage(
      ToastKind.Warning,
      `Compacted ${successCount} session(s), ${errorCount} failed. Check logs for details.`
    );
  }
}

async function handleBatchDelete(sessionProvider: SessionProvider) {
  const checkedSessionIds = sessionProvider.getCheckedSessions();

  if (checkedSessionIds.length === 0) {
    VscodeHelper.showToastMessage(ToastKind.Info, 'No sessions checked. Check sessions using the checkbox icon.');
    return;
  }

  const selection = checkedSessionIds
    .map((id) => {
      const session = sessionProvider.getSession(id);
      if (!session) return null;
      return new SessionTreeItem(session, VscodeConstants.TreeItemCollapsibleState.None);
    })
    .filter((item): item is SessionTreeItem => item !== null);

  const confirm = await VscodeHelper.showWarningMessage(
    `Delete ${selection.length} session(s)? This will also delete any compaction files.`,
    { modal: true },
    'Delete All'
  );

  if (confirm !== 'Delete All') {
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  await VscodeHelper.withProgress(
    {
      location: VscodeConstants.ProgressLocation.Notification,
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
    VscodeHelper.showToastMessage(ToastKind.Info, `Successfully deleted ${successCount} session(s)`);
  } else {
    VscodeHelper.showToastMessage(
      ToastKind.Warning,
      `Deleted ${successCount} session(s), ${errorCount} failed. Check logs for details.`
    );
  }
}

async function handleBatchAddLabel(sessionProvider: SessionProvider) {
  const checkedSessionIds = sessionProvider.getCheckedSessions();

  if (checkedSessionIds.length === 0) {
    VscodeHelper.showToastMessage(ToastKind.Info, 'No sessions checked. Check sessions using the checkbox icon.');
    return;
  }

  try {
    const labelWorkspacePath = VscodeHelper.getFirstWorkspaceFolder()?.uri.fsPath;
    if (!labelWorkspacePath) {
      VscodeHelper.showToastMessage(ToastKind.Error, 'No workspace folder found');
      return;
    }

    const projectName = ClaudeHelper.normalizePathForClaudeProjects(labelWorkspacePath);

    logger.info(`Batch add label: workspacePath=${labelWorkspacePath}`);
    logger.info(`Batch add label: projectName=${projectName}`);

    const allLabels = getSessionLabels();
    logger.info(`Batch add label: Found ${allLabels.length} labels`);

    if (allLabels.length === 0) {
      VscodeHelper.showToastMessage(
        ToastKind.Info,
        'No labels available. Create labels first using the individual session label command.'
      );
      return;
    }

    const labelOptions = allLabels.map((label) => ({
      label: label.name,
      description: label.color,
      value: label.id
    }));

    const selection = await VscodeHelper.showQuickPick(labelOptions, {
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

    VscodeHelper.showToastMessage(ToastKind.Info, `Toggled label "${selection.label}" for ${successCount} session(s)`);
  } catch (error) {
    logger.error('Batch add label failed', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to add label to sessions');
  }
}

export function createBatchOperationsCommands(
  sessionProvider: SessionProvider,
  decorationProvider: DecorationProvider,
  workspacePath: string
): Disposable[] {
  const compactService = new CompactService();

  return [
    registerCommand(Command.BatchCompact, () =>
      handleBatchCompact(sessionProvider, decorationProvider, workspacePath, compactService)
    ),
    registerCommand(Command.BatchDelete, () => handleBatchDelete(sessionProvider)),
    registerCommand(Command.BatchAddLabel, () => handleBatchAddLabel(sessionProvider))
  ];
}
