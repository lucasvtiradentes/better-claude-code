import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { EventEmitterClass, type TreeDataProvider, type TreeItem } from '../../common/vscode/vscode-types';
import { MemoryTreeItem } from './tree-items';
import { type MemoryInfo, MemoryType } from './types';

export class MemoryProvider implements TreeDataProvider<TreeItem> {
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
    const files = this.scanMemoryFiles();
    return files.map((info) => new MemoryTreeItem(info));
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  private scanMemoryFiles(): MemoryInfo[] {
    const files: MemoryInfo[] = [];

    const globalClaudeMd = path.join(os.homedir(), '.claude', 'CLAUDE.md');
    if (fs.existsSync(globalClaudeMd)) {
      files.push({
        name: 'CLAUDE.md',
        filePath: globalClaudeMd,
        memoryType: MemoryType.Global
      });
    }

    if (this.workspacePath) {
      const projectClaudeMd = path.join(this.workspacePath, 'CLAUDE.md');
      if (fs.existsSync(projectClaudeMd)) {
        files.push({
          name: 'CLAUDE.md',
          filePath: projectClaudeMd,
          memoryType: MemoryType.Project
        });
      }

      const projectClaudeMdAlt = path.join(this.workspacePath, '.claude', 'CLAUDE.md');
      if (fs.existsSync(projectClaudeMdAlt)) {
        files.push({
          name: '.claude/CLAUDE.md',
          filePath: projectClaudeMdAlt,
          memoryType: MemoryType.Project
        });
      }

      const localClaudeMd = path.join(this.workspacePath, 'CLAUDE.local.md');
      if (fs.existsSync(localClaudeMd)) {
        files.push({
          name: 'CLAUDE.local.md',
          filePath: localClaudeMd,
          memoryType: MemoryType.Local
        });
      }
    }

    return files;
  }
}
