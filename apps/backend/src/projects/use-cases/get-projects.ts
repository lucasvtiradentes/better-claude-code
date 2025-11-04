import { join } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import os from 'os';
import { z } from 'zod';
import { ErrorSchema } from '../../common/schemas.js';
import { ProjectSchema } from '../schemas.js';
import { extractProjectName, getCurrentBranch, getGitHubUrl, getRealPathFromSession, readSettings } from '../utils.js';

const responseSchema = z.array(ProjectSchema);

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns all projects'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to read projects'
  }
} as const;

export const route = createRoute({
  method: 'get',
  path: '/',
  tags: ['Projects'],
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const projectsPath = join(os.homedir(), '.claude', 'projects');
    const folders = await fs.readdir(projectsPath);

    const settings = await readSettings();

    const projects: any[] = [];

    for (const folder of folders) {
      const folderPath = join(projectsPath, folder);
      const stats = await fs.stat(folderPath);

      if (!stats.isDirectory()) continue;

      const realPath = await getRealPathFromSession(folderPath);

      if (!realPath) continue;

      const sessionFiles = await fs
        .readdir(folderPath)
        .then((files) => files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-')))
        .catch(() => []);

      const sessionsCount = sessionFiles.length;

      const fileStats = await Promise.all(sessionFiles.map((f) => fs.stat(join(folderPath, f)).then((s) => s.mtimeMs)));
      const lastModified = Math.max(...fileStats, stats.mtimeMs);

      let isGitRepo = false;
      let githubUrl: string | undefined;
      let currentBranch: string | undefined;
      try {
        await fs.access(join(realPath, '.git'));
        isGitRepo = true;
        githubUrl = await getGitHubUrl(realPath);
        currentBranch = await getCurrentBranch(realPath);
      } catch {
        isGitRepo = false;
      }

      const name = extractProjectName(realPath);
      const displayPath = realPath.replace(os.homedir(), '~');

      const projectSettings = settings?.projects.projectSettings[folder];

      projects.push({
        id: folder,
        name,
        path: displayPath,
        sessionsCount,
        lastModified,
        isGitRepo,
        githubUrl,
        currentBranch,
        labels: projectSettings?.labels || [],
        hidden: projectSettings?.hidden || false
      });
    }

    projects.sort((a, b) => b.lastModified - a.lastModified);

    return c.json(projects satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read projects' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
