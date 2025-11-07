import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, ProjectLabelSchema } from '../../../common/schemas.js';
import { readSettings, writeSettings } from '../utils.js';

const bodySchema = ProjectLabelSchema;
const responseSchema = ProjectLabelSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns created label'
  },
  400: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Invalid label data'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to create label'
  }
} as const;

export const route = createRoute({
  method: 'post',
  path: '/labels',
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
    const newLabel = c.req.valid('json');

    if (!newLabel.id || !newLabel.name || !newLabel.color) {
      return c.json({ error: 'Invalid label data' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    settings.projects.labels.push(newLabel);
    await writeSettings(settings);
    return c.json(newLabel satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to create label' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
