import { createReadStream } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { execAsync } from '@better-claude-code/node-utils';
import os from 'os';
import { AppSettings } from '../../common/schemas.js';

const SETTINGS_PATH = join(os.homedir(), '.config', 'bcc', 'settings.json');

interface GitCacheEntry {
  githubUrl?: string;
  currentBranch?: string;
  timestamp: number;
}

const gitCache = new Map<string, GitCacheEntry>();
const GIT_CACHE_TTL = 60000;

export async function readSettings(): Promise<AppSettings | null> {
  try {
    const content = await readFile(SETTINGS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function getRealPathFromSession(
  folderPath: string
): Promise<{ path: string | null; sessionFiles: string[] }> {
  try {
    const files = await readdir(folderPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    if (sessionFiles.length === 0) return { path: null, sessionFiles: [] };

    const firstSession = join(folderPath, sessionFiles[0]);

    const fileStream = createReadStream(firstSession, { encoding: 'utf-8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineCount = 0;
    for await (const line of rl) {
      if (lineCount >= 5) {
        rl.close();
        fileStream.close();
        break;
      }

      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);
        if (parsed.cwd) {
          rl.close();
          fileStream.close();
          return { path: parsed.cwd, sessionFiles };
        }
      } catch {}

      lineCount++;
    }

    return { path: null, sessionFiles };
  } catch {
    return { path: null, sessionFiles: [] };
  }
}

export function extractProjectName(fullPath: string) {
  const parts = fullPath.split('/').filter(Boolean);
  return parts[parts.length - 1] || fullPath;
}

export async function getGitInfo(projectPath: string): Promise<{ githubUrl?: string; currentBranch?: string }> {
  const cached = gitCache.get(projectPath);
  if (cached && Date.now() - cached.timestamp < GIT_CACHE_TTL) {
    return { githubUrl: cached.githubUrl, currentBranch: cached.currentBranch };
  }

  try {
    const [urlResult, branchResult] = await Promise.all([
      execAsync('git config --get remote.origin.url', { cwd: projectPath }).catch(() => ({ stdout: '' })),
      execAsync('git branch --show-current', { cwd: projectPath }).catch(() => ({ stdout: '' }))
    ]);

    const url = urlResult.stdout.trim();
    let githubUrl: string | undefined;

    if (url) {
      if (url.startsWith('https://github.com/')) {
        githubUrl = url.replace(/\.git$/, '');
      } else if (url.startsWith('git@github.com:')) {
        githubUrl = url.replace('git@github.com:', 'https://github.com/').replace(/\.git$/, '');
      }
    }

    const currentBranch = branchResult.stdout.trim() || undefined;

    gitCache.set(projectPath, { githubUrl, currentBranch, timestamp: Date.now() });

    return { githubUrl, currentBranch };
  } catch {
    return {};
  }
}
