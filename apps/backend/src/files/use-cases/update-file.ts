import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import { isAbsolute } from 'path';
import { z } from 'zod';
import { ErrorSchema } from '../../common/schemas.js';
import { UpdateFileBodySchema, UpdateFileResponseSchema } from '../schemas.js';

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: UpdateFileResponseSchema
      }
    },
    description: 'File updated successfully'
  },
  400: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'File path is required, must be absolute, or content must be a string'
  },
  404: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'File not found'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to write file'
  }
} as const;

export const route = createRoute({
  method: 'put',
  path: '/',
  tags: ['Files'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateFileBodySchema
        }
      }
    }
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { path: filePath, content } = c.req.valid('json');

    if (!filePath) {
      return c.json({ error: 'File path is required' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    if (!isAbsolute(filePath)) {
      return c.json({ error: 'Path must be absolute' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    if (typeof content !== 'string') {
      return c.json({ error: 'Content must be a string' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const stats = await fs.lstat(filePath);
    const targetPath = stats.isSymbolicLink() ? await fs.realpath(filePath) : filePath;

    await fs.writeFile(targetPath, content, 'utf-8');

    return c.json({ success: true, path: targetPath } satisfies z.infer<typeof UpdateFileResponseSchema>, 200);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return c.json({ error: 'File not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }
    return c.json({ error: 'Failed to write file' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
