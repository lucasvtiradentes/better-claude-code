import { logger } from '../../../common/utils/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { Disposable } from '../../../common/vscode/vscode-types';
import { SessionTreeItem } from '../../../views/sessions/tree-items';

export type OpenSessionFileParams = SessionTreeItem;
export type CopySessionPathParams = SessionTreeItem;

async function handleOpenSessionFile(item: OpenSessionFileParams) {
  if (!item || !(item instanceof SessionTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a session');
    return;
  }

  if (!item.session.filePath) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Session file path not available');
    return;
  }

  try {
    await VscodeHelper.openDocumentByPath(item.session.filePath);
    logger.info(`Opened session file: ${item.session.filePath}`);
  } catch (error) {
    logger.error('Failed to open session file', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open session file');
  }
}

async function handleCopySessionPath(item: CopySessionPathParams) {
  if (!item || !(item instanceof SessionTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a session');
    return;
  }

  if (!item.session.filePath) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Session file path not available');
    return;
  }

  try {
    await VscodeHelper.writeToClipboard(item.session.filePath);
    VscodeHelper.showToastMessage(ToastKind.Info, 'Session path copied to clipboard');
    logger.info(`Copied session path: ${item.session.filePath}`);
  } catch (error) {
    logger.error('Failed to copy session path', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to copy session path');
  }
}

export function createFileOperationsCommands(): Disposable[] {
  return [
    registerCommand(Command.OpenSessionFile, handleOpenSessionFile),
    registerCommand(Command.CopySessionPath, handleCopySessionPath)
  ];
}
