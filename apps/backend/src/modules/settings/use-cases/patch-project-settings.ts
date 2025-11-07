import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, ProjectSettingSchema } from '../../../common/schemas.js';
import { readSettings, writeSettings } from '../utils.js';

const paramsSchema = z.object({
  projectId: z.string()
});

const bodySchema = ProjectSettingSchema.partial();
const responseSchema = ProjectSettingSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns updated project settings'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to update project settings'
  }
} as const;

export const route = createRoute({
  method: 'patch',
  path: '/projects/{projectId}',
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
    const { projectId } = c.req.valid('param');
    const settings = await readSettings();

    if (!settings.projects.projectSettings[projectId]) {
      settings.projects.projectSettings[projectId] = {
        labels: [],
        hidden: false
      };
    }

    const updates = c.req.valid('json');
    if (updates.labels !== undefined) {
      settings.projects.projectSettings[projectId].labels = updates.labels;
    }
    if (updates.hidden !== undefined) {
      settings.projects.projectSettings[projectId].hidden = updates.hidden;
    }

    await writeSettings(settings);
    return c.json(settings.projects.projectSettings[projectId] satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to update project settings' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
