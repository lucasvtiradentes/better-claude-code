import { accessSync } from 'node:fs';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';
import { readSettings, writeSettings } from '../../settings/utils.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const bodySchema = z.object({
  labelId: z.string()
});

const responseSchema = z.object({
  success: z.boolean(),
  labels: z.array(z.string())
});

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Label toggled successfully'
  },
  400: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'labelId is required'
  },
  404: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Session not found'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to toggle label'
  }
} as const;

export const route = createRoute({
  method: 'post',
  path: '/{projectName}/{sessionId}/labels',
  tags: ['Sessions'],
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
    const { projectName, sessionId } = c.req.valid('param');
    const { labelId } = c.req.valid('json');

    if (!labelId) {
      return c.json({ error: 'labelId is required' } satisfies z.infer<typeof ErrorSchema>, 400);
    }

    const sessionFile = ClaudeHelper.getSessionPath(projectName, sessionId);

    try {
      accessSync(sessionFile);
    } catch {
      return c.json({ error: 'Session not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }

    const settings = await readSettings();
    const label = settings.sessions.labels.find((l) => l.id === labelId);

    if (!label) {
      return c.json({ error: 'Label not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }

    if (!label.sessions) {
      label.sessions = {};
    }

    if (!label.sessions[projectName]) {
      label.sessions[projectName] = [];
    }

    const hadLabel = label.sessions[projectName].includes(sessionId);

    if (hadLabel) {
      label.sessions[projectName] = label.sessions[projectName].filter((id) => id !== sessionId);
      if (label.sessions[projectName].length === 0) {
        delete label.sessions[projectName];
      }
    } else {
      label.sessions[projectName].push(sessionId);
    }

    await writeSettings(settings);

    const currentLabels = settings.sessions.labels
      .filter((l) => l.sessions?.[projectName]?.includes(sessionId))
      .map((l) => l.id);

    return c.json({ success: true, labels: currentLabels } satisfies z.infer<typeof responseSchema>, 200);
  } catch (error) {
    return c.json(
      { error: 'Failed to toggle label', details: String(error) } satisfies z.infer<typeof ErrorSchema>,
      500
    );
  }
};
