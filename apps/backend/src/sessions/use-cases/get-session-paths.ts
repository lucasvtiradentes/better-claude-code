import { join, resolve } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import os from 'os';
import { z } from 'zod';
import { ErrorSchema } from '../../common/schemas.js';
import { extractPathsFromText, extractTextContent, getRealPathFromSession } from '../utils.js';

const paramsSchema = z.object({
  projectName: z.string(),
  sessionId: z.string()
});

const PathValidationSchema = z.object({
  path: z.string(),
  exists: z.boolean()
});

const responseSchema = z.array(PathValidationSchema);

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns validated paths'
  },
  404: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Project path not found'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to validate paths'
  }
} as const;

export const route = createRoute({
  method: 'get',
  path: '/{projectName}/{sessionId}/paths',
  tags: ['Sessions'],
  request: {
    params: paramsSchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectName, sessionId } = c.req.valid('param');
    const sessionFile = join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);

    const content = await fs.readFile(sessionFile, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    const projectPath = join(os.homedir(), '.claude', 'projects', projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    if (!realProjectPath) {
      return c.json({ error: 'Project path not found' } satisfies z.infer<typeof ErrorSchema>, 404);
    }

    const pathsSet = new Set<string>();

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'user') {
          const textContent = extractTextContent(parsed.message?.content);
          const paths = extractPathsFromText(textContent);
          for (const path of paths) {
            pathsSet.add(path);
          }
        }
      } catch {}
    }

    const results = await Promise.all(
      Array.from(pathsSet).map(async (pathStr) => {
        try {
          const cleanPath = pathStr.startsWith('/') ? pathStr.slice(1) : pathStr;
          const fullPath = resolve(realProjectPath, cleanPath);
          if (!fullPath.startsWith(realProjectPath)) {
            return { path: pathStr, exists: false };
          }
          await fs.access(fullPath);
          return { path: pathStr, exists: true };
        } catch {
          return { path: pathStr, exists: false };
        }
      })
    );

    return c.json(results satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to validate paths' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
