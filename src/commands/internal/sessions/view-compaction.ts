import { ClaudeHelper, getCompactionSummaryPath } from '@/lib/node-utils';
import { logger } from '../../../common/utils/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { VscodeConstants } from '../../../common/vscode/vscode-constants';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import { SessionTreeItem } from '../../../sidebar/tree-items';

export type ViewCompactionParams = SessionTreeItem;

async function handleViewCompaction(item: ViewCompactionParams, workspacePath: string) {
  if (!item || !(item instanceof SessionTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a session to view compaction');
    return;
  }

  if (!item.session.hasCompaction) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'This session does not have a compaction available');
    return;
  }

  try {
    const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(workspacePath);
    const summaryPath = getCompactionSummaryPath(normalizedPath, item.session.id);

    logger.info(`Opening compaction summary: ${summaryPath}`);

    await VscodeHelper.openDocumentByPath(summaryPath, {
      preview: false,
      viewColumn: VscodeConstants.ViewColumn.Active
    });
  } catch (error) {
    logger.error('Failed to open compaction summary', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open compaction summary');
  }
}

export function createViewCompactionCommand(workspacePath: string) {
  return registerCommand(Command.ViewCompaction, (item: ViewCompactionParams) =>
    handleViewCompaction(item, workspacePath)
  );
}
