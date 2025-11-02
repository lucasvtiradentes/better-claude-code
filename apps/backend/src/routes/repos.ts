import type { Repository } from '@bcc/shared';
import { Router, type Router as RouterType } from 'express';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export const reposRouter: RouterType = Router();

async function getRealPathFromSession(folderPath: string): Promise<string | null> {
  try {
    const files = await fs.readdir(folderPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    if (sessionFiles.length === 0) return null;

    const firstSession = path.join(folderPath, sessionFiles[0]);
    const content = await fs.readFile(firstSession, 'utf-8');
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

reposRouter.get('/', async (_req, res) => {
  try {
    const projectsPath = path.join(os.homedir(), '.claude', 'projects');
    const folders = await fs.readdir(projectsPath);

    const repos: Repository[] = [];

    for (const folder of folders) {
      const folderPath = path.join(projectsPath, folder);
      const stats = await fs.stat(folderPath);

      if (!stats.isDirectory()) continue;

      const realPath = await getRealPathFromSession(folderPath);

      if (!realPath) continue;

      const sessionFiles = await fs
        .readdir(folderPath)
        .then((files) => files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-')))
        .catch(() => []);

      const sessionsCount = sessionFiles.length;

      const fileStats = await Promise.all(
        sessionFiles.map((f) => fs.stat(path.join(folderPath, f)).then((s) => s.mtimeMs))
      );
      const lastModified = Math.max(...fileStats, stats.mtimeMs);

      let isGitRepo = false;
      try {
        await fs.access(path.join(realPath, '.git'));
        isGitRepo = true;
      } catch {
        isGitRepo = false;
      }

      const name = extractRepoName(realPath);
      const displayPath = realPath.replace(os.homedir(), '~');

      repos.push({
        name,
        path: displayPath,
        sessionsCount,
        lastModified,
        isGitRepo
      });
    }

    repos.sort((a, b) => b.lastModified - a.lastModified);

    res.json(repos);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read repositories' });
  }
});
