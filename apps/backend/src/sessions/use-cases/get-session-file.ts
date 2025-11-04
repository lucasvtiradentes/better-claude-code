import { join, resolve } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import os from 'os';
import { z } from 'zod';
import { ErrorSchema, FolderContentSchema } from '../../schemas.js';
import { getRealPathFromSession } from '../utils.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const querySchema = z.object({
  path: z.string()
});

const responseSchema = FolderContentSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns file content'
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
    description: 'Failed to read file'
  }
} as const;

export const route = createRoute({
  method: 'get',
  path: '/{projectName}/{sessionId}/file',
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
    const { path: filePath } = c.req.valid('query');

    if (!filePath) {
      return c.json({ error: 'Path parameter is required' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const projectPath = join(os.homedir(), '.claude', 'projects', projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    if (!realProjectPath) {
      return c.json({ error: 'Project path not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }

    const fullPath = resolve(realProjectPath, filePath.startsWith('/') ? filePath.slice(1) : filePath);

    if (!fullPath.startsWith(realProjectPath)) {
      return c.json({ error: 'Access denied' } satisfies z.infer<typeof ErrorSchema>, 403);
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    return c.json({ content } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read file' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
