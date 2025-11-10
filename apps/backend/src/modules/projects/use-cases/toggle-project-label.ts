import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, SuccessSchema } from '../../../common/schemas.js';
import { readSettings, writeSettings } from '../../settings/utils.js';

const paramsSchema = z.object({
  projectId: z.string()
});

const bodySchema = z.object({
  labelId: z.string()
});

const responseSchema = SuccessSchema;

export const route = createRoute({
  method: 'post',
  path: '/projects/{projectId}/labels/toggle',
  tags: ['Projects'],
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
  responses: {
    200: {
      description: 'Toggle project label',
      content: {
        'application/json': {
          schema: responseSchema
        }
      }
    },
    404: {
      description: 'Label not found',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    }
  }
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectId } = c.req.valid('param');
    const { labelId } = c.req.valid('json');

    const settings = await readSettings();

    const targetLabel = settings.projects.labels.find((l) => l.id === labelId);
    if (!targetLabel) {
      return c.json({ error: 'Label not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }

    if (!targetLabel.projects) {
      targetLabel.projects = [];
    }

    const hasLabel = targetLabel.projects.includes(projectId);

    for (const label of settings.projects.labels) {
      if (!label.projects) {
        label.projects = [];
      }
      label.projects = label.projects.filter((id) => id !== projectId);
    }

    if (!hasLabel) {
      targetLabel.projects.push(projectId);
    }

    await writeSettings(settings);

    return c.json({ success: true } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to toggle project label' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
