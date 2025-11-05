import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import { extname, isAbsolute } from 'path';
import { z } from 'zod';
import { ErrorSchema } from '../../common/schemas.js';

const querySchema = z.object({
  path: z.string()
});

const responseSchema = z.object({
  content: z.string(),
  extension: z.string(),
  isSymlink: z.boolean(),
  realPath: z.string(),
  path: z.string()
});

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns file content and metadata'
  },
  400: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'File path is required or must be absolute'
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
    description: 'Failed to read file'
  }
} as const;

export const route = createRoute({
  method: 'get',
  path: '/',
  tags: ['Files'],
  request: {
    query: querySchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { path: filePath } = c.req.valid('query');

    if (!filePath) {
      return c.json({ error: 'File path is required' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    if (!isAbsolute(filePath)) {
      return c.json({ error: 'Path must be absolute' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.lstat(filePath);
    const isSymlink = stats.isSymbolicLink();
    const realPath = isSymlink ? await fs.realpath(filePath) : filePath;
    const extension = extname(filePath);

    return c.json(
      {
        content,
        extension,
        isSymlink,
        realPath,
        path: filePath
      } satisfies z.infer<typeof responseSchema>,
      200
    );
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return c.json({ error: 'File not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }
    return c.json({ error: 'Failed to read file' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
