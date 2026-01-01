import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { EventEmitterClass, type TreeDataProvider, type TreeItem } from '../../common/vscode/vscode-types';
import { RuleTreeItem } from './tree-items';
import type { RuleInfo } from './types';

export class RulesProvider implements TreeDataProvider<TreeItem> {
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
    const rules = this.scanAllRules();
    return rules.map((info) => new RuleTreeItem(info));
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  private scanAllRules(): RuleInfo[] {
    const files: RuleInfo[] = [];

    const globalRulesDir = path.join(os.homedir(), '.claude', 'rules');
    const globalRules = this.scanRulesDirectory(globalRulesDir, true);
    files.push(...globalRules);

    if (this.workspacePath) {
      const projectRulesDir = path.join(this.workspacePath, '.claude', 'rules');
      const projectRules = this.scanRulesDirectory(projectRulesDir, false);
      files.push(...projectRules);
    }

    return files.sort((a, b) => {
      if (a.isGlobal !== b.isGlobal) {
        return a.isGlobal ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  private scanRulesDirectory(dirPath: string, isGlobal: boolean): RuleInfo[] {
    const files: RuleInfo[] = [];

    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const scanRecursive = (currentPath: string, basePath: string) => {
      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          if (entry.isDirectory()) {
            scanRecursive(fullPath, basePath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            const relativePath = path.relative(basePath, fullPath);
            const dirName = path.dirname(relativePath);
            files.push({
              name: entry.name.replace('.md', ''),
              filePath: fullPath,
              isGlobal,
              relativePath: dirName !== '.' ? dirName : undefined
            });
          }
        }
      } catch {
        // Ignore errors
      }
    };

    scanRecursive(dirPath, dirPath);
    return files;
  }
}
