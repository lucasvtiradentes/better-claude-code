import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, ProjectLabelSchema } from '../../../common/schemas.js';
import { readSettings, writeSettings } from '../utils.js';

const paramsSchema = z.object({
  labelId: z.string()
});

const bodySchema = ProjectLabelSchema.partial();
const responseSchema = ProjectLabelSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns updated session label'
  },
  404: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Label not found'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to update label'
  }
} as const;

export const route = createRoute({
  method: 'patch',
  path: '/sessions/labels/{labelId}',
  tags: ['Settings'],
  request: {
    params: paramsSchema,
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
    const { labelId } = c.req.valid('param');
    const settings = await readSettings();
    const labelIndex = settings.sessions.labels.findIndex((l) => l.id === labelId);

    if (labelIndex === -1) {
      return c.json({ error: 'Label not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }

    const updates = c.req.valid('json');
    if (updates.name !== undefined) {
      settings.sessions.labels[labelIndex].name = updates.name;
    }
    if (updates.color !== undefined) {
      settings.sessions.labels[labelIndex].color = updates.color;
    }

    await writeSettings(settings);
    return c.json(settings.sessions.labels[labelIndex] satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to update label' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
