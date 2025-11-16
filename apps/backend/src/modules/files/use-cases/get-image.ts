import { lstatSync, readFileSync } from 'node:fs';
import { extname, isAbsolute } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';

const querySchema = z.object({
  path: z.string()
});

const responseSchema = z.object({
  data: z.string(),
  mediaType: z.string(),
  path: z.string()
});

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns image as base64 data'
  },
  400: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'File path is required, must be absolute, or is not an image'
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
  path: '/image',
  tags: ['Files'],
  request: {
    query: querySchema
  },
  responses: ResponseSchemas
});

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
const MEDIA_TYPE_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml'
};

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { path: filePath } = c.req.valid('query');

    if (!filePath) {
      return c.json({ error: 'File path is required' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    if (!isAbsolute(filePath)) {
      return c.json({ error: 'Path must be absolute' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const extension = extname(filePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(extension)) {
      return c.json({ error: 'File is not an image' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const stats = lstatSync(filePath);
    if (!stats.isFile()) {
      return c.json({ error: 'Path is not a file' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const buffer = readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const mediaType = MEDIA_TYPE_MAP[extension] || 'application/octet-stream';

    return c.json(
      {
        data: base64,
        mediaType,
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
