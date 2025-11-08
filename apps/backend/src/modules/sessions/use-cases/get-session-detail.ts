import { readFileSync } from 'node:fs';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { MessageSource } from '@better-claude-code/shared';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';
import { extractTextContent } from '../utils.js';

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

function cleanUserMessage(content: string): string[] {
  const parts = content.split('---').map((p) => p.trim());
  const cleanedParts: string[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part === 'Warmup') continue;

    const firstLine = part.split('\n')[0].replace(/\\/g, '').replace(/\s+/g, ' ').trim();

    if (firstLine.includes('Caveat:')) continue;

    const commandMatch = firstLine.match(/<command-name>\/?([^<]+)<\/command-name>/);
    if (commandMatch) {
      const commandName = commandMatch[1];
      if (commandName === 'clear') continue;
    }

    const isSystemMessage =
      firstLine.startsWith('<local-command-') ||
      firstLine.startsWith('[Tool:') ||
      firstLine.startsWith('[Request interrupted');

    if (isSystemMessage) continue;

    cleanedParts.push(part);
  }

  return cleanedParts;
}

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectName, sessionId } = c.req.valid('param');
    const filePath = ClaudeHelper.getSessionPath(projectName, sessionId);

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines.map((line) => JSON.parse(line));

    const messages: Array<{ type: MessageSource; content: string; timestamp?: number }> = [];

    for (const event of events) {
      if (ClaudeHelper.isUserMessage(event.type)) {
        const textContent = extractTextContent(event.message?.content || event.content);
        if (textContent && textContent !== 'Warmup') {
          const cleanedParts = cleanUserMessage(textContent);
          for (const part of cleanedParts) {
            messages.push({
              type: event.type,
              content: part,
              timestamp: event.timestamp
            });
          }
        }
      } else if (ClaudeHelper.isCCMessage(event.type)) {
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

    const groupedMessages: Array<{ type: MessageSource; content: string; timestamp?: number }> = [];
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
        if (ClaudeHelper.isUserMessage(event.type) && Array.isArray(event.message?.content)) {
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
