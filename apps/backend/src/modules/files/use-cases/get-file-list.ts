import { homedir } from 'node:os';
import { join } from 'node:path';
import { getPromptPathForBackend, PromptFile } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';

const FileInfoSchema = z.object({
  path: z.string(),
  label: z.string()
});

const responseSchema = z.object({
  files: z.array(FileInfoSchema)
});

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
    const promptPath = getPromptPathForBackend(PromptFile.SESSION_COMPACTION);

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
