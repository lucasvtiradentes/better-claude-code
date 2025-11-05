import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execAsync } from '@better-claude-code/node-utils';
import os from 'os';
import { AppSettings } from '../common/schemas.js';

const SETTINGS_PATH = join(os.homedir(), '.config', 'bcc', 'settings.json');

export async function readSettings(): Promise<AppSettings | null> {
  try {
    const content = readFileSync(SETTINGS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function getRealPathFromSession(folderPath: string): Promise<string | null> {
  try {
    const files = readdirSync(folderPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    if (sessionFiles.length === 0) return null;

    const firstSession = join(folderPath, sessionFiles[0]);
    const content = readFileSync(firstSession, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);
        if (parsed.cwd) {
          return parsed.cwd;
        }
      } catch {}
    }

    return null;
  } catch {
    return null;
  }
}

export function extractProjectName(fullPath: string): string {
  const parts = fullPath.split('/').filter(Boolean);
  return parts[parts.length - 1] || fullPath;
}

export async function getGitHubUrl(projectPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('git config --get remote.origin.url', { cwd: projectPath });
    const url = stdout.trim();

    if (!url) return undefined;

    if (url.startsWith('https://github.com/')) {
      return url.replace(/\.git$/, '');
    }

    if (url.startsWith('git@github.com:')) {
      return url.replace('git@github.com:', 'https://github.com/').replace(/\.git$/, '');
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export async function getCurrentBranch(projectPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('git branch --show-current', { cwd: projectPath });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}
