import { readFileSync } from 'node:fs';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { MessageSource } from '@better-claude-code/shared';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';
import { parseSessionMessages } from '../services/session-parser.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const MessageSchema = z.object({
  type: z.enum(MessageSource),
  content: z.string(),
  timestamp: z.number().optional()
});

const ImageSchema = z.object({
  index: z.number(),
  data: z.string()
});

const responseSchema = z.object({
  messages: z.array(MessageSchema),
  images: z.array(ImageSchema)
});

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns session details with messages and images'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to read session'
  }
} as const;

export const route = createRoute({
  method: 'get',
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

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines.map((line) => JSON.parse(line));

    const { messages, images } = parseSessionMessages(events, {
      groupMessages: true,
      includeImages: true
    });

    return c.json({ messages, images } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read session' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
