import { join } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import os from 'os';
import { z } from 'zod';
import { ErrorSchema } from '../../common/schemas.js';
import { extractTextContent } from '../utils.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const MessageSchema = z.object({
  type: z.enum(['user', 'assistant']),
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
    const filePath = join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines.map((line) => JSON.parse(line));

    const messages: Array<{ type: 'user' | 'assistant'; content: string; timestamp?: number }> = [];

    for (const event of events) {
      if (event.type === 'user' || event.type === 'assistant') {
        const textContent = extractTextContent(event.message?.content || event.content);
        if (textContent && textContent !== 'Warmup') {
          messages.push({
            type: event.type,
            content: textContent,
            timestamp: event.timestamp
          });
        }
      }
    }

    const groupedMessages: Array<{ type: 'user' | 'assistant'; content: string; timestamp?: number }> = [];
    for (const msg of messages) {
      const lastMsg = groupedMessages[groupedMessages.length - 1];
      if (lastMsg && lastMsg.type === msg.type) {
        lastMsg.content = `${lastMsg.content}\n---\n${msg.content}`;
      } else {
        groupedMessages.push({ ...msg });
      }
    }

    const filteredMessages = groupedMessages.filter((msg) => msg.content.trim().length > 0);

    const images: Array<{ index: number; data: string }> = [];
    try {
      for (const event of events) {
        if (event.type === 'user' && Array.isArray(event.message?.content)) {
          for (const item of event.message.content) {
            if (item.type === 'image') {
              const imageData = item.source?.type === 'base64' ? item.source.data : null;
              if (imageData) {
                images.push({ index: images.length + 1, data: imageData });
              }
            }
          }
        }
      }
    } catch {}

    return c.json({ messages: filteredMessages, images } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read session' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
