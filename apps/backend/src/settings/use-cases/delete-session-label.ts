import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, SuccessSchema } from '../../common/schemas.js';
import { readSettings, writeSettings } from '../utils.js';

const paramsSchema = z.object({
  labelId: z.string()
});

const responseSchema = SuccessSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Session label deleted successfully'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to delete label'
  }
} as const;

export const route = createRoute({
  method: 'delete',
  path: '/sessions/labels/{labelId}',
  tags: ['Settings'],
  request: {
    params: paramsSchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { labelId } = c.req.valid('param');
    const settings = await readSettings();

    settings.sessions.labels = settings.sessions.labels.filter((l) => l.id !== labelId);

    await writeSettings(settings);
    return c.json({ success: true } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to delete label' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
