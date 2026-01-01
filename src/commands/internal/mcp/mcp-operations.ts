import { logger } from '../../../common/lib/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { Disposable } from '../../../common/vscode/vscode-types';
import type { MCPServersProvider } from '../../../views/mcp/mcp-provider';
import { MCPServerTreeItem } from '../../../views/mcp/tree-items';
import type { MCPServerInfo } from '../../../views/mcp/types';

function handleToggleMCPServer(mcpProvider: MCPServersProvider, serverInfo: MCPServerInfo) {
  if (!serverInfo) {
    return;
  }

  const newState = mcpProvider.toggle(serverInfo);
  const status = newState ? 'enabled' : 'disabled';
  logger.info(`MCP server ${serverInfo.name} ${status}`);
}

async function handleGoToMCPDefinition(item: MCPServerTreeItem) {
  if (!item || !(item instanceof MCPServerTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select an MCP server');
    return;
  }

  try {
    const { filePath, lineNumber } = item.serverInfo;
    await VscodeHelper.openDocumentAtLine(filePath, lineNumber);
    logger.info(`Opened MCP definition: ${filePath}:${lineNumber}`);
  } catch (error) {
    logger.error('Failed to open MCP definition', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open MCP definition');
  }
}

export function createMCPOperationsCommands(mcpProvider: MCPServersProvider): Disposable[] {
  return [
    registerCommand(Command.ToggleMCPServer, (serverInfo: MCPServerInfo) =>
      handleToggleMCPServer(mcpProvider, serverInfo)
    ),
    registerCommand(Command.GoToMCPDefinition, handleGoToMCPDefinition),
    registerCommand(Command.RefreshMCPServers, () => mcpProvider.refresh())
  ];
}
