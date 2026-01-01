import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { EventEmitterClass, type TreeDataProvider, type TreeItem } from '../../common/vscode/vscode-types';
import { type BaseResourceTreeItem, type ResourceInfo } from './base-tree-item';

export abstract class BaseResourceProvider<T extends BaseResourceTreeItem> implements TreeDataProvider<TreeItem> {
  protected _onDidChangeTreeData = new EventEmitterClass<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  protected workspacePath: string | undefined;

  abstract getLocalDirName(): string;
  abstract getGlobalDirPath(): string;
  abstract getFileExtension(): string;
  abstract createTreeItem(info: ResourceInfo): T;

  setWorkspacePath(workspacePath: string): void {
    this.workspacePath = workspacePath;
    this.refresh();
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  async getChildren(): Promise<TreeItem[]> {
    const items: T[] = [];

    const globalItems = this.scanDirectory(this.getGlobalDirPath(), true);
    for (const info of globalItems) {
      items.push(this.createTreeItem(info));
    }

    if (this.workspacePath) {
      const localPath = path.join(this.workspacePath, this.getLocalDirName());
      const localItems = this.scanDirectory(localPath, false);
      for (const info of localItems) {
        items.push(this.createTreeItem(info));
      }
    }

    return items;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  protected scanDirectory(dirPath: string, isGlobal: boolean): ResourceInfo[] {
    const items: ResourceInfo[] = [];
    const ext = this.getFileExtension();

    if (!fs.existsSync(dirPath)) {
      return items;
    }

    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith(ext)) {
          const name = file.replace(ext, '');
          const filePath = path.join(dirPath, file);
          items.push({ name, filePath, isGlobal });
        }
      }
    } catch {
      return items;
    }

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  protected getHomeDir(): string {
    return os.homedir();
  }
}
