import * as os from 'node:os';
import * as path from 'node:path';
import { EventEmitterClass, type TreeDataProvider, type TreeItem } from '../../common/vscode/vscode-types';
import { parseLocalScopeMCPConfig, parseMCPConfigFile, parseProjectMCPConfig } from './config-parser';
import { isMCPServerEnabled, toggleMCPServer } from './state';
import { MCPServerTreeItem } from './tree-items';
import type { MCPServerInfo } from './types';

export class MCPServersProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new EventEmitterClass<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private workspacePath: string | undefined;

  setWorkspacePath(workspacePath: string): void {
    this.workspacePath = workspacePath;
    this.refresh();
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  async getChildren(): Promise<TreeItem[]> {
    const items: MCPServerTreeItem[] = [];
    const servers = this.scanAllConfigs();

    for (const server of servers) {
      const isEnabled = isMCPServerEnabled(server.name, server.isGlobal, this.workspacePath);
      items.push(new MCPServerTreeItem(server, isEnabled));
    }

    return items;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  toggle(serverInfo: MCPServerInfo): boolean {
    const newState = toggleMCPServer(serverInfo.name, serverInfo.isGlobal, this.workspacePath);
    this.refresh();
    return newState;
  }

  private scanAllConfigs(): MCPServerInfo[] {
    const servers: MCPServerInfo[] = [];
    const claudeJsonPath = path.join(os.homedir(), '.claude.json');

    const globalServers = parseMCPConfigFile(claudeJsonPath, true, false);
    servers.push(...globalServers);

    if (this.workspacePath) {
      const localServers = parseLocalScopeMCPConfig(claudeJsonPath, this.workspacePath);
      servers.push(...localServers);

      const projectConfigPath = path.join(this.workspacePath, '.mcp.json');
      const projectServers = parseProjectMCPConfig(projectConfigPath);
      servers.push(...projectServers);
    }

    return servers.sort((a, b) => {
      if (a.isGlobal !== b.isGlobal) {
        return a.isGlobal ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }
}
