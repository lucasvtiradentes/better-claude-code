import { join } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import os from 'os';
import { z } from 'zod';
import { ErrorSchema, SuccessSchema } from '../../schemas.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const responseSchema = SuccessSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Session deleted successfully'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to delete session'
  }
} as const;

export const route = createRoute({
  method: 'delete',
  path: '/{projectName}/{sessionId}',
  tags: ['Sessions'],
  request: {
    params: paramsSchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectName, sessionId } = c.req.valid('param');
    const filePath = join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);
    const metadataPath = join(os.homedir(), '.claude', 'projects', projectName, '.metadata', `${sessionId}.json`);

    await fs.unlink(filePath);

    try {
      await fs.unlink(metadataPath);
    } catch {}

    return c.json({ success: true } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to delete session' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
