import { access, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import {
  getSessionCountGroup,
  getTimeGroup,
  SESSION_COUNT_GROUP_LABELS,
  SESSION_COUNT_GROUP_ORDER,
  TIME_GROUP_LABELS,
  TIME_GROUP_ORDER
} from '@better-claude-code/shared';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { JsonFileCache } from '../../../common/cache.js';
import { ErrorSchema } from '../../../common/schemas.js';
import { extractProjectName, getGitInfo, getRealPathFromSession, readSettings } from '../utils.js';

const CACHE_DIR = join(homedir(), '.config', 'bcc', 'cache');
const listProjectsCache = new JsonFileCache(join(CACHE_DIR, 'projects'));

interface ProjectCacheEntry {
  id: string;
  name: string;
  path: string;
  sessionsCount: number;
  lastModified: number;
  isGitRepo: boolean;
  githubUrl?: string;
  currentBranch?: string;
  labels: string[];
  hidden: boolean;
  folderMtime: number;
}

const querySchema = z.object({
  groupBy: z.enum(['date', 'session-count', 'label']).optional(),
  search: z.string().optional(),
  skipCache: z.coerce.boolean().optional().default(false)
});

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
  hidden: z.boolean(),
  cached: z.boolean()
});

const GroupSchema = z.object({
  key: z.string(),
  label: z.string(),
  color: z.string().nullable().optional(),
  items: z.array(ProjectSchema),
  totalItems: z.number()
});

const ungroupedResponseSchema = z.array(ProjectSchema);

const groupedResponseSchema = z.object({
  groups: z.array(GroupSchema),
  meta: z.object({
    totalItems: z.number(),
    totalGroups: z.number()
  })
});

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: z.union([ungroupedResponseSchema, groupedResponseSchema])
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
  request: {
    query: querySchema
  },
  responses: ResponseSchemas
});

async function processProject(folder: string, projectsPath: string, settings: any) {
  const folderPath = join(projectsPath, folder);
  const stats = await stat(folderPath);

  if (!stats.isDirectory()) return null;

  const { path: realPath, sessionFiles } = await getRealPathFromSession(folderPath);

  if (!realPath) return null;

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
    const gitInfo = await getGitInfo(realPath);
    githubUrl = gitInfo.githubUrl;
    currentBranch = gitInfo.currentBranch;
  } catch {
    isGitRepo = false;
  }

  const name = extractProjectName(realPath);
  const displayPath = realPath.replace(homedir(), '~');

  const hidden = settings?.projects.hiddenProjects.includes(folder) || false;

  const labels: string[] = [];
  if (settings?.projects.labels) {
    for (const label of settings.projects.labels) {
      if (label.projects?.includes(folder)) {
        labels.push(label.id);
      }
    }
  }

  return {
    id: folder,
    name,
    path: displayPath,
    sessionsCount,
    lastModified,
    isGitRepo,
    githubUrl,
    currentBranch,
    labels,
    hidden,
    folderMtime: stats.mtimeMs
  };
}

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const _startTime = Date.now();
    const { groupBy, search, skipCache } = c.req.valid('query');
    const projectsPath = ClaudeHelper.getProjectsDir();

    const [folders, settings] = await Promise.all([readdir(projectsPath), readSettings()]);

    const cachedData = skipCache ? {} : (await listProjectsCache.get<Record<string, ProjectCacheEntry>>('all-projects')) || {};

    const folderMtimes = await Promise.all(
      folders.map(async (folder) => {
        try {
          const folderPath = join(projectsPath, folder);
          const stats = await stat(folderPath);
          return { folder, mtime: stats.isDirectory() ? stats.mtimeMs : null };
        } catch {
          return { folder, mtime: null };
        }
      })
    );

    const foldersToProcess: string[] = [];
    const cachedProjects: (ProjectCacheEntry & { isCached: boolean })[] = [];

    for (const { folder, mtime } of folderMtimes) {
      if (mtime === null) continue;

      const cached = cachedData?.[folder];
      if (!cached) {
        foldersToProcess.push(folder);
      } else {
        cachedProjects.push({ ...cached, isCached: true });
      }
    }

    const processedResults = await Promise.all(
      foldersToProcess.map((folder) => processProject(folder, projectsPath, settings))
    );

    const newProjects = processedResults.filter((p) => p !== null) as ProjectCacheEntry[];
    const newProjectsWithFlag = newProjects.map((p) => ({ ...p, isCached: false }));

    const updatedCache: Record<string, ProjectCacheEntry> = { ...(cachedData || {}) };
    for (const project of newProjects) {
      updatedCache[project.id] = project;
    }

    const existingFolderSet = new Set(folders);
    for (const cachedId of Object.keys(updatedCache)) {
      if (!existingFolderSet.has(cachedId)) {
        delete updatedCache[cachedId];
      }
    }

    listProjectsCache.set('all-projects', updatedCache, 30 * 24 * 60 * 60 * 1000).catch(() => {});

    let projects = [...cachedProjects, ...newProjectsWithFlag].map(({ folderMtime, isCached, ...rest }) => ({
      ...rest,
      cached: isCached
    }));

    projects.sort((a, b) => b.lastModified - a.lastModified);

    if (search) {
      const lowerSearch = search.toLowerCase();
      projects = projects.filter(
        (p) => p.name.toLowerCase().includes(lowerSearch) || p.path.toLowerCase().includes(lowerSearch)
      );
    }

    if (!groupBy) {
      return c.json(projects satisfies z.infer<typeof ungroupedResponseSchema>, 200);
    }

    const grouped: Record<string, typeof projects> = {};

    if (groupBy === 'date') {
      projects.forEach((project) => {
        const groupKey = getTimeGroup(project.lastModified);
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(project);
      });

      const groups = TIME_GROUP_ORDER.map((key) => ({
        key,
        label: TIME_GROUP_LABELS[key as keyof typeof TIME_GROUP_LABELS],
        color: null,
        items: grouped[key] || [],
        totalItems: grouped[key]?.length || 0
      })).filter((g) => g.totalItems > 0);

      return c.json(
        {
          groups,
          meta: {
            totalItems: projects.length,
            totalGroups: groups.length
          }
        } satisfies z.infer<typeof groupedResponseSchema>,
        200
      );
    }

    if (groupBy === 'session-count') {
      projects.forEach((project) => {
        const groupKey = getSessionCountGroup(project.sessionsCount);
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(project);
      });

      const groups = SESSION_COUNT_GROUP_ORDER.map((key) => ({
        key,
        label: SESSION_COUNT_GROUP_LABELS[key as keyof typeof SESSION_COUNT_GROUP_LABELS],
        color: null,
        items: grouped[key] || [],
        totalItems: grouped[key]?.length || 0
      })).filter((g) => g.totalItems > 0);

      return c.json(
        {
          groups,
          meta: {
            totalItems: projects.length,
            totalGroups: groups.length
          }
        } satisfies z.infer<typeof groupedResponseSchema>,
        200
      );
    }

    if (groupBy === 'label') {
      grouped['no-label'] = [];

      projects.forEach((project) => {
        if (!project.labels || project.labels.length === 0) {
          grouped['no-label'].push(project);
        } else {
          project.labels.forEach((labelId) => {
            if (!grouped[labelId]) grouped[labelId] = [];
            grouped[labelId].push(project);
          });
        }
      });

      const labelIds = settings?.projects.labels.map((l) => l.id) || [];
      const groups = [...labelIds, 'no-label']
        .map((key) => {
          const label = settings?.projects.labels.find((l) => l.id === key);
          return {
            key,
            label: key === 'no-label' ? 'No Label' : label?.name || key,
            color: label?.color || null,
            items: grouped[key] || [],
            totalItems: grouped[key]?.length || 0
          };
        })
        .filter((g) => g.totalItems > 0);

      return c.json(
        {
          groups,
          meta: {
            totalItems: projects.length,
            totalGroups: groups.length
          }
        } satisfies z.infer<typeof groupedResponseSchema>,
        200
      );
    }

    return c.json(projects satisfies z.infer<typeof ungroupedResponseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read projects' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
