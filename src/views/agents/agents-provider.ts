import * as os from 'node:os';
import * as path from 'node:path';
import { BaseResourceProvider } from '../_base/base-resource-provider';
import type { ResourceInfo } from '../_base/base-tree-item';
import { AgentTreeItem } from './tree-items';

export class AgentsProvider extends BaseResourceProvider<AgentTreeItem> {
  getLocalDirName(): string {
    return '.claude/agents';
  }

  getGlobalDirPath(): string {
    return path.join(os.homedir(), '.claude', 'agents');
  }

  getFileExtension(): string {
    return '.md';
  }

  createTreeItem(info: ResourceInfo): AgentTreeItem {
    return new AgentTreeItem(info);
  }
}
