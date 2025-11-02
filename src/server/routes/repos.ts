import { Router as createRouter, type Router } from 'express';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { isCompactionSession } from '../utils/session-filter.js';

export const reposRouter: Router = createRouter();

interface RepoInfo {
  id: string;
  name: string;
  fullPath: string;
  sessionCount: number;
  lastModified: number;
  isGitRepo: boolean;
}

function getClaudeProjectsDir(): string {
  return join(homedir(), '.claude', 'projects');
}

function getRealPathFromSession(sessionDir: string): string | null {
  try {
    const files = readdirSync(sessionDir).filter((file) => file.endsWith('.jsonl') && !file.startsWith('agent-'));

    if (files.length === 0) return null;

    const firstSession = join(sessionDir, files[0]);
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

function extractRepoName(fullPath: string): string {
  const parts = fullPath.split('/').filter(Boolean);
  return parts[parts.length - 1] || fullPath;
}

reposRouter.get('/', (_req, res) => {
  const projectsDir = getClaudeProjectsDir();

  if (!existsSync(projectsDir)) {
    return res.json({ repos: [] });
  }

  const repos: RepoInfo[] = [];
  const entries = readdirSync(projectsDir);

  for (const entry of entries) {
    const entryPath = join(projectsDir, entry);
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      const allSessions = readdirSync(entryPath).filter((file) => file.endsWith('.jsonl') && !file.startsWith('agent-'));

      const sessions = allSessions.filter((file) => !isCompactionSession(join(entryPath, file)));

      const lastModified = Math.max(...allSessions.map((s) => statSync(join(entryPath, s)).mtimeMs), stat.mtimeMs);

      const realPath = getRealPathFromSession(entryPath);

      if (!realPath) {
        continue;
      }

      const name = extractRepoName(realPath);
      const displayPath = realPath.replace(homedir(), '~');

      repos.push({
        id: entry,
        name,
        fullPath: displayPath,
        sessionCount: sessions.length,
        lastModified,
        isGitRepo: existsSync(join(realPath, '.git'))
      });
    }
  }

  repos.sort((a, b) => b.lastModified - a.lastModified);

  res.json({ repos });
});
