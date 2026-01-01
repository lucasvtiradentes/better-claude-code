import { logger } from '../../../common/lib/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { Disposable } from '../../../common/vscode/vscode-types';
import type { AgentsProvider } from '../../../views/agents/agents-provider';
import { AgentTreeItem } from '../../../views/agents/tree-items';

async function handleOpenAgentFile(item: AgentTreeItem) {
  if (!item || !(item instanceof AgentTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select an agent');
    return;
  }

  try {
    await VscodeHelper.openDocumentByPath(item.filePath);
    logger.info(`Opened agent file: ${item.filePath}`);
  } catch (error) {
    logger.error('Failed to open agent file', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open agent file');
  }
}

export function createAgentOperationsCommands(agentsProvider: AgentsProvider): Disposable[] {
  return [
    registerCommand(Command.OpenAgentFile, handleOpenAgentFile),
    registerCommand(Command.RefreshAgents, () => agentsProvider.refresh())
  ];
}
