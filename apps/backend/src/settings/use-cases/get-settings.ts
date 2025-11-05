import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, ProjectLabelSchema } from '../../common/schemas.js';
import { readSettings } from '../utils.js';

const ProjectSettingSchema = z.object({
  labels: z.array(z.string()),
  hidden: z.boolean()
});

const responseSchema = z.object({
  projects: z.object({
    groupBy: z.enum(['date', 'label', 'session-count']),
    filters: z.object({
      selectedLabels: z.array(z.string())
    }),
    display: z.object({
      showSessionCount: z.boolean(),
      showCurrentBranch: z.boolean(),
      showActionButtons: z.boolean(),
      showProjectLabel: z.boolean()
    }),
    search: z.string(),
    labels: z.array(ProjectLabelSchema),
    projectSettings: z.record(z.string(), ProjectSettingSchema)
  }),
  sessions: z.object({
    groupBy: z.enum(['date', 'token-percentage', 'label']),
    filters: z.record(z.string(), z.unknown()),
    display: z.object({
      showTokenPercentage: z.boolean(),
      showAttachments: z.boolean()
    }),
    labels: z.array(ProjectLabelSchema)
  })
});

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
