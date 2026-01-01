import { logger } from '../../../common/lib/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { Disposable } from '../../../common/vscode/vscode-types';
import type { MemoryProvider } from '../../../views/memory/memory-provider';
import { MemoryTreeItem } from '../../../views/memory/tree-items';

async function handleOpenMemoryFile(item: MemoryTreeItem) {
  if (!item || !(item instanceof MemoryTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a memory file');
    return;
  }

  try {
    await VscodeHelper.openDocumentByPath(item.memoryInfo.filePath);
    logger.info(`Opened memory file: ${item.memoryInfo.filePath}`);
  } catch (error) {
    logger.error('Failed to open memory file', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open memory file');
  }
}

export function createMemoryOperationsCommands(memoryProvider: MemoryProvider): Disposable[] {
  return [
    registerCommand(Command.OpenMemoryFile, handleOpenMemoryFile),
    registerCommand(Command.RefreshMemory, () => memoryProvider.refresh())
  ];
}
