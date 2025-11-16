import { createReadStream } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import {
  BCC_SETTINGS_PATH,
  ClaudeHelper,
  execAsync,
  parseSessionLine,
  validateSessionFile
} from '@better-claude-code/node-utils';
import { AppSettings } from '../../common/schemas.js';

const SETTINGS_PATH = BCC_SETTINGS_PATH;

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
): Promise<{ path: string | null; sessionFiles: string[]; validSessionFiles: string[] }> {
  try {
    const files = await readdir(folderPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    if (sessionFiles.length === 0) return { path: null, sessionFiles: [], validSessionFiles: [] };

    const validSessionFiles: string[] = [];
    const skippedCompaction: string[] = [];

    for (const sessionFile of sessionFiles) {
      const sessionPath = join(folderPath, sessionFile);
      const sessionId = sessionFile.replace('.jsonl', '');

      try {
        const content = await readFile(sessionPath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);

        if (ClaudeHelper.isCompactionSession(lines)) {
          skippedCompaction.push(sessionId);
          continue;
        }

        const validation = validateSessionFile(lines);
        if (validation.isValid) {
          validSessionFiles.push(sessionId);
        }
      } catch {}
    }

    for (const sessionFile of sessionFiles) {
      const sessionPath = join(folderPath, sessionFile);

      try {
        const fileStream = createReadStream(sessionPath, { encoding: 'utf-8' });
        const rl = createInterface({
          input: fileStream,
          crlfDelay: Infinity
        });

        let lineCount = 0;
        for await (const line of rl) {
          if (lineCount >= 50) {
            rl.close();
            fileStream.close();
            break;
          }

          const parsed = parseSessionLine(line);
          if (parsed?.cwd) {
            rl.close();
            fileStream.close();
            return { path: parsed.cwd, sessionFiles, validSessionFiles };
          }

          lineCount++;
        }
      } catch {}
    }

    return { path: null, sessionFiles, validSessionFiles };
  } catch {
    return { path: null, sessionFiles: [], validSessionFiles: [] };
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
