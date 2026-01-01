import { ClaudeHelper } from '../../../common/lib/claude-helper';
import { logger } from '../../../common/lib/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { Disposable } from '../../../common/vscode/vscode-types';
import type { CommandsProvider } from '../../../views/commands/commands-provider';
import { CommandTreeItem } from '../../../views/commands/tree-items';

async function handleOpenCommandFile(item: CommandTreeItem) {
  if (!item || !(item instanceof CommandTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a command');
    return;
  }

  try {
    await VscodeHelper.openDocumentByPath(item.filePath);
    logger.info(`Opened command file: ${item.filePath}`);
  } catch (error) {
    logger.error('Failed to open command file', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open command file');
  }
}

function handleRunCommandInTerminal(item: CommandTreeItem) {
  if (!item || !(item instanceof CommandTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a command');
    return;
  }

  try {
    const command = ClaudeHelper.getSlashCommandTerminalCommand(item.resourceName);
    const terminal = VscodeHelper.createTerminal(`Claude: ${item.resourceName}`);
    terminal.show();
    terminal.sendText(command);
    logger.info(`Running command in terminal: ${command}`);
  } catch (error) {
    logger.error('Failed to run command in terminal', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to run command in terminal');
  }
}

export function createCommandOperationsCommands(commandsProvider: CommandsProvider): Disposable[] {
  return [
    registerCommand(Command.OpenCommandFile, handleOpenCommandFile),
    registerCommand(Command.RunCommandInTerminal, handleRunCommandInTerminal),
    registerCommand(Command.RefreshCommands, () => commandsProvider.refresh())
  ];
}
