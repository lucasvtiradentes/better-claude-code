import { unlinkSync } from 'node:fs';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, SuccessSchema } from '../../common/schemas.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const responseSchema = SuccessSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Session deleted successfully'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to delete session'
  }
} as const;

export const route = createRoute({
  method: 'delete',
  path: '/{projectName}/{sessionId}',
  tags: ['Sessions'],
  request: {
    params: paramsSchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectName, sessionId } = c.req.valid('param');
    const filePath = ClaudeHelper.getSessionPath(projectName, sessionId);
    const metadataPath = ClaudeHelper.getSessionMetadataPath(projectName, sessionId);

    await unlinkSync(filePath);

    try {
      await unlinkSync(metadataPath);
    } catch {}

    return c.json({ success: true } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to delete session' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
