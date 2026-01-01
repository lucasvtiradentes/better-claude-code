import { Command, getCommandId } from '../../common/vscode/vscode-commands';
import { VscodeColor, VscodeConstants } from '../../common/vscode/vscode-constants';
import { ThemeColorClass, ThemeIconClass, TreeItemClass } from '../../common/vscode/vscode-types';
import type { MCPServerInfo } from './types';

export const GLOBAL_MCP_PREFIX = '(G) ';

export class MCPServerTreeItem extends TreeItemClass {
  public readonly serverInfo: MCPServerInfo;
  public readonly isEnabled: boolean;

  constructor(info: MCPServerInfo, isEnabled: boolean) {
    const label = info.isGlobal ? `${GLOBAL_MCP_PREFIX}${info.name}` : info.name;
    super(label, VscodeConstants.TreeItemCollapsibleState.None);

    this.serverInfo = info;
    this.isEnabled = isEnabled;

    const serverType = info.config.type || 'stdio';
    this.description = serverType;
    this.tooltip = this.buildTooltip(info);
    this.contextValue = info.isGlobal ? 'mcpServerItemGlobal' : 'mcpServerItem';

    if (isEnabled) {
      this.iconPath = new ThemeIconClass('plug', new ThemeColorClass(VscodeColor.ChartsGreen));
    } else {
      this.iconPath = new ThemeIconClass('plug');
    }

    this.command = {
      command: getCommandId(Command.ToggleMCPServer),
      title: 'Toggle MCP Server',
      arguments: [info]
    };
  }

  private buildTooltip(info: MCPServerInfo): string {
    const lines: string[] = [];
    lines.push(`Name: ${info.name}`);
    lines.push(`Type: ${info.config.type || 'stdio'}`);
    lines.push(`Scope: ${info.isGlobal ? 'Global' : 'Project'}`);
    lines.push(`File: ${info.filePath}:${info.lineNumber}`);

    if (info.config.command) {
      lines.push(`Command: ${info.config.command}`);
    }
    if (info.config.url) {
      lines.push(`URL: ${info.config.url}`);
    }

    return lines.join('\n');
  }
}
