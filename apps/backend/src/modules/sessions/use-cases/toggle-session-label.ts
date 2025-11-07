import { accessSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';

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

    const metadataPath = ClaudeHelper.getSessionMetadataPath(projectName, sessionId);

    mkdirSync(dirname(metadataPath), { recursive: true });

    let metadata: { labels?: string[] } = {};
    try {
      const content = readFileSync(metadataPath, 'utf-8');
      metadata = JSON.parse(content);
    } catch {
      metadata = { labels: [] };
    }

    if (!metadata.labels) {
      metadata.labels = [];
    }

    const labelIndex = metadata.labels.indexOf(labelId);
    if (labelIndex === -1) {
      metadata.labels = [labelId];
    } else {
      metadata.labels = [];
    }

    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return c.json({ success: true, labels: metadata.labels } satisfies z.infer<typeof responseSchema>, 200);
  } catch (error) {
    return c.json(
      { error: 'Failed to toggle label', details: String(error) } satisfies z.infer<typeof ErrorSchema>,
      500
    );
  }
};
