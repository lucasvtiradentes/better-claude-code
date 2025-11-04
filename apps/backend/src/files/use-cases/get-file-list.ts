import { dirname, join } from 'node:path';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { ErrorSchema, FileListResponseSchema } from '../../schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const responseSchema = FileListResponseSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns list of available files'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to list files'
  }
} as const;

export const route = createRoute({
  method: 'get',
  path: '/list',
  tags: ['Files'],
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const promptPathDev = join(__dirname, '../../../../cli/src/prompts/session-compation.prompt.md');
    const promptPathProd = join(__dirname, '../../../cli/prompts/session-compation.prompt.md');

    const promptPath = await fs
      .access(promptPathDev)
      .then(() => promptPathDev)
      .catch(() => promptPathProd);

    const files = [
      {
        path: join(homedir(), '.claude', 'CLAUDE.md'),
        label: 'Global CLAUDE.md'
      },
      {
        path: promptPath,
        label: 'Session Compaction Prompt'
      }
    ];

    return c.json({ files } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to list files' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
