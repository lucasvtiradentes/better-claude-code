import { join, resolve } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import os from 'os';
import { z } from 'zod';
import { ErrorSchema, FolderEntriesSchema } from '../../schemas.js';
import { getRealPathFromSession } from '../utils.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const querySchema = z.object({
  path: z.string()
});

const responseSchema = FolderEntriesSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns folder entries'
  },
  400: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Path parameter is required'
  },
  403: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Access denied'
  },
  404: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Project path not found'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to read folder'
  }
} as const;

export const route = createRoute({
  method: 'get',
  path: '/{projectName}/{sessionId}/folder',
  tags: ['Sessions'],
  request: {
    params: paramsSchema,
    query: querySchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectName } = c.req.valid('param');
    const { path: folderPath } = c.req.valid('query');

    if (!folderPath) {
      return c.json({ error: 'Path parameter is required' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const projectPath = join(os.homedir(), '.claude', 'projects', projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    if (!realProjectPath) {
      return c.json({ error: 'Project path not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }

    const fullPath = resolve(realProjectPath, folderPath.startsWith('/') ? folderPath.slice(1) : folderPath);

    if (!fullPath.startsWith(realProjectPath)) {
      return c.json({ error: 'Access denied' } satisfies z.infer<typeof ErrorSchema>, 403);
    }

    const dirEntries = await fs.readdir(fullPath, { withFileTypes: true });
    const entries = dirEntries
      .filter((entry) => !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        path: join(folderPath, entry.name),
        type: entry.isDirectory() ? ('directory' as const) : ('file' as const)
      }))
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });

    return c.json({ entries } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read folder' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
