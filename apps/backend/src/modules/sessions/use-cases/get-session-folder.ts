import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { FolderEntry } from '@better-claude-code/shared';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';
import { getRealPathFromSession } from '../utils.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const querySchema = z.object({
  path: z.string()
});

const FolderEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum([FolderEntry.FILE, FolderEntry.DIRECTORY])
});

const responseSchema = z.object({
  entries: z.array(FolderEntrySchema)
});

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

    const projectPath = ClaudeHelper.getProjectDir(projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    if (!realProjectPath) {
      return c.json({ error: 'Project path not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }

    const fullPath = resolve(realProjectPath, folderPath.startsWith('/') ? folderPath.slice(1) : folderPath);

    if (!fullPath.startsWith(realProjectPath)) {
      return c.json({ error: 'Access denied' } satisfies z.infer<typeof ErrorSchema>, 403);
    }

    const dirEntries = readdirSync(fullPath, { withFileTypes: true });
    const entries = dirEntries
      .filter((entry) => !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        path: join(folderPath, entry.name),
        type: entry.isDirectory() ? (FolderEntry.DIRECTORY as const) : FolderEntry.FILE
      }))
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === FolderEntry.DIRECTORY ? -1 : 1;
      });

    return c.json({ entries } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read folder' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
