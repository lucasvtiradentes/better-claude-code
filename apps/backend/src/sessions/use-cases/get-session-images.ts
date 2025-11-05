import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import os from 'os';
import { z } from 'zod';
import { ErrorSchema } from '../../common/schemas.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const ImageSchema = z.object({
  index: z.number(),
  data: z.string()
});

const responseSchema = z.array(ImageSchema);

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns session images'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to extract images'
  }
} as const;

export const route = createRoute({
  method: 'get',
  path: '/{projectName}/{sessionId}/images',
  tags: ['Sessions'],
  request: {
    params: paramsSchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  const { projectName, sessionId } = c.req.valid('param');

  try {
    const filePath = join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    const images: Array<{ index: number; data: string }> = [];
    let imageIndex = 1;

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const messageContent = parsed.message?.content;

        if (Array.isArray(messageContent)) {
          for (const item of messageContent) {
            if (item.type === 'image' && item.source?.type === 'base64') {
              images.push({
                index: imageIndex++,
                data: item.source.data
              });
            }
          }
        }
      } catch {}
    }

    return c.json(images satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to extract images' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
