import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { getGitRepoRoot } from '../git.js';

export interface SessionInfo {
  id: string;
  file: string;
  timestamp: number;
  userCount: number;
  assistantCount: number;
  title: string;
  shortId: string;
}

function getCurrentDirectory(): string {
  return process.cwd();
}

function normalizePathForClaudeProjects(dirPath: string): string {
  return dirPath.replace(/\/_/g, '--').replace(/\//g, '-').replace(/_/g, '-');
}

export async function getProjectDir(): Promise<string> {
  const claudeDir = join(homedir(), '.claude');

  let currentDir: string;
  try {
    currentDir = await getGitRepoRoot();
  } catch {
    currentDir = getCurrentDirectory();
  }

  const normalized = normalizePathForClaudeProjects(currentDir);
  const projectDir = join(claudeDir, 'projects', normalized);
  return projectDir;
}

export async function findSessions(limit?: number): Promise<SessionInfo[]> {
  const projectDir = await getProjectDir();

  if (!existsSync(projectDir)) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  const files = readdirSync(projectDir)
    .filter((file) => file.endsWith('.jsonl') && !file.startsWith('agent-'))
    .map((file) => ({
      file: join(projectDir, file),
      id: file.replace('.jsonl', ''),
      mtime: statSync(join(projectDir, file)).mtimeMs
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const sessions: SessionInfo[] = [];
  const limitToUse = limit || 20;

  for (let i = 0; i < Math.min(files.length, limitToUse); i++) {
    const { file, id, mtime } = files[i];
    const content = readFileSync(file, 'utf-8');
    const lines = content.trim().split('\n');

    const userCount = lines.filter((line) => {
      try {
        const parsed = JSON.parse(line);
        return parsed.type === 'user';
      } catch {
        return false;
      }
    }).length;

    const assistantCount = lines.filter((line) => {
      try {
        const parsed = JSON.parse(line);
        return parsed.type === 'assistant';
      } catch {
        return false;
      }
    }).length;

    let title = '';
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'user' && typeof parsed.message?.content === 'string') {
          const content = parsed.message.content;
          if (content && content !== 'Warmup' && !content.includes('Caveat:')) {
            title = content.replace(/\n/g, ' ').trim().substring(0, 60);
            if (title.length === 60) title += '...';
            break;
          }
        }
      } catch {}
    }

    sessions.push({
      id,
      file,
      timestamp: mtime,
      userCount,
      assistantCount,
      title: title || 'Empty session',
      shortId: id.slice(-12)
    });
  }

  return sessions;
}

export async function findSessionById(sessionId: string): Promise<SessionInfo | null> {
  const projectDir = await getProjectDir();
  const fullId = sessionId.length < 36 ? findFullSessionId(projectDir, sessionId) : sessionId;

  if (!fullId) {
    return null;
  }

  const sessionFile = join(projectDir, `${fullId}.jsonl`);

  if (!existsSync(sessionFile)) {
    return null;
  }

  const content = readFileSync(sessionFile, 'utf-8');
  const lines = content.trim().split('\n');

  const userCount = lines.filter((line) => {
    try {
      const parsed = JSON.parse(line);
      return parsed.type === 'user';
    } catch {
      return false;
    }
  }).length;

  const assistantCount = lines.filter((line) => {
    try {
      const parsed = JSON.parse(line);
      return parsed.type === 'assistant';
    } catch {
      return false;
    }
  }).length;

  return {
    id: fullId,
    file: sessionFile,
    timestamp: statSync(sessionFile).mtimeMs,
    userCount,
    assistantCount,
    title: '',
    shortId: fullId.slice(-12)
  };
}

function findFullSessionId(projectDir: string, partialId: string): string | null {
  const files = readdirSync(projectDir).filter(
    (file) => file.endsWith('.jsonl') && !file.startsWith('agent-') && file.includes(partialId)
  );

  return files.length > 0 ? files[0].replace('.jsonl', '') : null;
}
