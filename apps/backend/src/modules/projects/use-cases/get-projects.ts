import { access, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';
import { extractProjectName, getCurrentBranch, getGitHubUrl, getRealPathFromSession, readSettings } from '../utils.js';

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  sessionsCount: z.number(),
  lastModified: z.number(),
  isGitRepo: z.boolean(),
  githubUrl: z.string().optional(),
  currentBranch: z.string().optional(),
  labels: z.array(z.string()),
  hidden: z.boolean()
});

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
    const projectsPath = ClaudeHelper.getProjectsDir();
    const folders = await readdir(projectsPath);

    const settings = await readSettings();

    const projectPromises = folders.map(async (folder) => {
      const folderPath = join(projectsPath, folder);
      const stats = await stat(folderPath);

      if (!stats.isDirectory()) return null;

      const realPath = await getRealPathFromSession(folderPath);

      if (!realPath) return null;

      let sessionFiles: string[] = [];
      try {
        const files = await readdir(folderPath);
        sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));
      } catch {
        sessionFiles = [];
      }

      const sessionsCount = sessionFiles.length;

      const fileStatsPromises = sessionFiles.map((f) => stat(join(folderPath, f)).then((s) => s.mtimeMs));
      const fileStats = await Promise.all(fileStatsPromises);
      const lastModified = Math.max(...fileStats, stats.mtimeMs);

      let isGitRepo = false;
      let githubUrl: string | undefined;
      let currentBranch: string | undefined;
      try {
        await access(join(realPath, '.git'));
        isGitRepo = true;
        [githubUrl, currentBranch] = await Promise.all([getGitHubUrl(realPath), getCurrentBranch(realPath)]);
      } catch {
        isGitRepo = false;
      }

      const name = extractProjectName(realPath);
      const displayPath = realPath.replace(homedir(), '~');

      const projectSettings = settings?.projects.projectSettings[folder];

      return {
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
      };
    });

    const projectsResults = await Promise.all(projectPromises);
    const projects = projectsResults.filter((p) => p !== null);

    projects.sort((a, b) => b.lastModified - a.lastModified);

    return c.json(projects satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read projects' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
