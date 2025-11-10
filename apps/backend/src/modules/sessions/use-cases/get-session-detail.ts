import { accessSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ClaudeHelper, extractTextContent, MessageSource, parseSessionMessages } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';
import { extractPathsFromText, getRealPathFromSession } from '../utils.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const MessageSchema = z.object({
  id: z.string(),
  type: z.enum(MessageSource),
  content: z.string(),
  timestamp: z.number().optional()
});

const ImageSchema = z.object({
  index: z.number(),
  data: z.string(),
  messageId: z.string()
});

const PathValidationSchema = z.object({
  path: z.string(),
  exists: z.boolean()
});

const responseSchema = z.object({
  messages: z.array(MessageSchema),
  images: z.array(ImageSchema),
  paths: z.array(PathValidationSchema)
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

    const projectPath = ClaudeHelper.getProjectDir(projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    const pathsSet = new Set<string>();

    if (realProjectPath) {
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (ClaudeHelper.isUserMessage(parsed.type)) {
            const textContent = extractTextContent(parsed.message?.content);
            const paths = extractPathsFromText(textContent);
            for (const path of paths) {
              pathsSet.add(path);
            }
          }
        } catch {}
      }
    }

    const paths = await Promise.all(
      Array.from(pathsSet).map(async (pathStr) => {
        if (!realProjectPath) {
          return { path: pathStr, exists: false };
        }
        try {
          const cleanPath = pathStr.startsWith('/') ? pathStr.slice(1) : pathStr;
          const fullPath = resolve(realProjectPath, cleanPath);
          if (!fullPath.startsWith(realProjectPath)) {
            return { path: pathStr, exists: false };
          }
          accessSync(fullPath);
          return { path: pathStr, exists: true };
        } catch {
          return { path: pathStr, exists: false };
        }
      })
    );

    return c.json({ messages, images, paths } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to read session' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
