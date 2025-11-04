import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { AppSettingsSchema, ErrorSchema } from '../../schemas.js';
import { readSettings } from '../utils.js';

const responseSchema = AppSettingsSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns app settings'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to read settings'
  }
} as const;

export const route = createRoute({
  method: 'get',
  path: '/',
  tags: ['Settings'],
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const settings = await readSettings();
    return c.json(settings satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read settings' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
