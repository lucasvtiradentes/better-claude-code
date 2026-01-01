import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { BaseResourceProvider } from '../_base/base-resource-provider';
import type { ResourceInfo } from '../_base/base-tree-item';
import { SkillTreeItem } from './tree-items';

const SKILL_FILE_NAME = 'SKILL.md';

export class SkillsProvider extends BaseResourceProvider<SkillTreeItem> {
  getLocalDirName(): string {
    return '.claude/skills';
  }

  getGlobalDirPath(): string {
    return path.join(os.homedir(), '.claude', 'skills');
  }

  getFileExtension(): string {
    return '.md';
  }

  createTreeItem(info: ResourceInfo): SkillTreeItem {
    return new SkillTreeItem(info);
  }

  protected override scanDirectory(dirPath: string, isGlobal: boolean): ResourceInfo[] {
    const items: ResourceInfo[] = [];

    if (!fs.existsSync(dirPath)) {
      return items;
    }

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillFilePath = path.join(dirPath, entry.name, SKILL_FILE_NAME);
          if (fs.existsSync(skillFilePath)) {
            items.push({
              name: entry.name,
              filePath: skillFilePath,
              isGlobal
            });
          }
        }
      }
    } catch {
      return items;
    }

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }
}
