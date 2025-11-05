import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, ProjectLabelSchema } from '../../common/schemas.js';
import { readSettings, writeSettings } from '../utils.js';

const ProjectSettingSchema = z.object({
  labels: z.array(z.string()),
  hidden: z.boolean()
});

const AppSettingsSchema = z.object({
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
