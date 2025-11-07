import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { AppSettingsSchema, ErrorSchema } from '../../../common/schemas.js';
import { readSettings, writeSettings } from '../utils.js';

const bodySchema = AppSettingsSchema.partial();
const responseSchema = AppSettingsSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns updated settings'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to update settings'
  }
} as const;

export const route = createRoute({
  method: 'patch',
  path: '/',
  tags: ['Settings'],
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

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const settings = await readSettings();
    const updates = c.req.valid('json');

    if (updates.projects) {
      settings.projects = { ...settings.projects, ...updates.projects };
    }

    if (updates.sessions) {
      settings.sessions = { ...settings.sessions, ...updates.sessions };
    }

    await writeSettings(settings);
    return c.json(settings satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to update settings' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
