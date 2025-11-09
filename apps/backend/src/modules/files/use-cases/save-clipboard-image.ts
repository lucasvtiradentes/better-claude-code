import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';

const bodySchema = z.object({
  data: z.string(),
  mediaType: z.string()
});

const responseSchema = z.object({
  path: z.string()
});

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Image saved successfully'
  },
  400: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Invalid request data'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to save image'
  }
} as const;

export const route = createRoute({
  method: 'post',
  path: '/clipboard-image',
  tags: ['Files'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: bodySchema
        }
      }
    }
  },
  responses: ResponseSchemas
});

const EXTENSION_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp'
};

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { data, mediaType } = c.req.valid('json');

    if (!data || !mediaType) {
      return c.json({ error: 'Data and mediaType are required' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const extension = EXTENSION_MAP[mediaType] || '.png';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `screenshot-${timestamp}-${random}${extension}`;
    const tmpDir = tmpdir();
    const imgDir = join(tmpDir, 'img');

    const { mkdirSync } = await import('node:fs');
    mkdirSync(imgDir, { recursive: true });

    const filePath = join(imgDir, filename);
    const buffer = Buffer.from(data, 'base64');
    writeFileSync(filePath, buffer);

    return c.json(
      {
        path: filePath
      } satisfies z.infer<typeof responseSchema>,
      200
    );
  } catch (error) {
    console.error('Failed to save clipboard image:', error);
    return c.json({ error: 'Failed to save image' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
