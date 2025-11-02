import type { Repository } from '@bcc/shared';
import { Router, type Router as RouterType } from 'express';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export const reposRouter: RouterType = Router();

reposRouter.get('/', async (_req, res) => {
  try {
    const projectsPath = path.join(os.homedir(), '.claude', 'projects');
    const folders = await fs.readdir(projectsPath);

    const repos: Repository[] = [];

    for (const folder of folders) {
      const folderPath = path.join(projectsPath, folder);
      const stats = await fs.stat(folderPath);

      if (!stats.isDirectory()) continue;

      const sessionsPath = path.join(folderPath, 'sessions');
      let sessionsCount = 0;
      let isGitRepo = false;

      try {
        const sessions = await fs.readdir(sessionsPath);
        sessionsCount = sessions.filter((f) => f.endsWith('.jsonl')).length;
      } catch {
        sessionsCount = 0;
      }

      try {
        await fs.access(path.join(folderPath, '.git'));
        isGitRepo = true;
      } catch {
        isGitRepo = false;
      }

      repos.push({
        name: folder,
        path: folderPath,
        sessionsCount,
        lastModified: stats.mtimeMs,
        isGitRepo
      });
    }

    res.json(repos);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read repositories' });
  }
});
