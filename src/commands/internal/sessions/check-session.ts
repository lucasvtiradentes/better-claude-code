import * as vscode from 'vscode';
import { logger } from '../../../common/utils/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { Disposable } from '../../../common/vscode/vscode-types';
import type { SessionProvider } from '../../../sidebar/session-provider';
import { SessionTreeItem } from '../../../sidebar/tree-items';

export type ToggleCheckSessionParams = SessionTreeItem;

function handleToggleCheckSession(item: ToggleCheckSessionParams, sessionProvider: SessionProvider) {
  if (!item || !(item instanceof SessionTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a session to check/uncheck');
    return;
  }

  try {
    const isChecked = sessionProvider.toggleCheckSession(item.session.id);
    const action = isChecked ? 'checked' : 'unchecked';
    logger.info(`Session ${item.session.shortId} ${action}`);

    const checkedCount = sessionProvider.getCheckedSessions().length;
    if (checkedCount > 0) {
      VscodeHelper.showToastMessage(ToastKind.Info, `${checkedCount} session(s) checked`);
    }
  } catch (error) {
    logger.error('Failed to toggle check session', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to toggle check session');
  }
}

function handleClearAllChecks(sessionProvider: SessionProvider) {
  const checkedCount = sessionProvider.getCheckedSessions().length;

  if (checkedCount === 0) {
    VscodeHelper.showToastMessage(ToastKind.Info, 'No sessions are checked');
    return;
  }

  try {
    sessionProvider.clearAllChecks();
    logger.info(`Cleared ${checkedCount} checked sessions`);
    VscodeHelper.showToastMessage(ToastKind.Info, `Cleared ${checkedCount} checked session(s)`);
  } catch (error) {
    logger.error('Failed to clear checks', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to clear checks');
  }
}

async function handleBatchOperationsMenu(sessionProvider: SessionProvider) {
  const checkedCount = sessionProvider.getCheckedSessions().length;

  if (checkedCount === 0) {
    VscodeHelper.showToastMessage(ToastKind.Info, 'No sessions checked. Check sessions using the checkbox icon.');
    return;
  }

  const options = [
    {
      label: '$(archive) Compact Sessions',
      description: `Compact ${checkedCount} checked session(s)`,
      command: 'bcc.batchCompact'
    },
    {
      label: '$(trash) Delete Sessions',
      description: `Delete ${checkedCount} checked session(s)`,
      command: 'bcc.batchDelete'
    },
    {
      label: '$(tag) Add Label',
      description: `Add label to ${checkedCount} checked session(s)`,
      command: 'bcc.batchAddLabel'
    },
    {
      label: '$(clear-all) Clear Checks',
      description: `Uncheck all ${checkedCount} session(s)`,
      command: 'bcc.clearAllChecks'
    }
  ];

  const selected = await VscodeHelper.showQuickPick(options, {
    placeHolder: `Batch operations for ${checkedCount} checked session(s)`,
    matchOnDescription: true
  });

  if (selected) {
    await vscode.commands.executeCommand(selected.command);
  }
}

export function createCheckSessionCommands(sessionProvider: SessionProvider): Disposable[] {
  return [
    registerCommand(Command.ToggleCheckSession, (item: ToggleCheckSessionParams) =>
      handleToggleCheckSession(item, sessionProvider)
    ),
    registerCommand(Command.ClearAllChecks, () => handleClearAllChecks(sessionProvider)),
    registerCommand(Command.BatchOperationsMenu, () => handleBatchOperationsMenu(sessionProvider))
  ];
}
