import * as os from 'node:os';
import * as path from 'node:path';
import { BaseResourceProvider } from '../_base/base-resource-provider';
import type { ResourceInfo } from '../_base/base-tree-item';
import { CommandTreeItem } from './tree-items';

export class CommandsProvider extends BaseResourceProvider<CommandTreeItem> {
  getLocalDirName(): string {
    return '.claude/commands';
  }

  getGlobalDirPath(): string {
    return path.join(os.homedir(), '.claude', 'commands');
  }

  getFileExtension(): string {
    return '.md';
  }

  createTreeItem(info: ResourceInfo): CommandTreeItem {
    return new CommandTreeItem(info);
  }
}
