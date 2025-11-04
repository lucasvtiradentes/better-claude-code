// @ts-nocheck
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { dirname, extname, isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { ErrorSchema, FileContentSchema, FileListResponseSchema } from '../schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const filesRouter = new OpenAPIHono();

const getFileListRoute = createRoute({
  method: 'get',
  path: '/list',
  tags: ['Files'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: FileListResponseSchema
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
  }
});

filesRouter.openapi(getFileListRoute, async (c) => {
  try {
    const promptPathDev = join(__dirname, '../../../cli/src/prompts/session-compation.prompt.md');
    const promptPathProd = join(__dirname, '../../cli/prompts/session-compation.prompt.md');

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

    return c.json({ files });
  } catch {
    return c.json({ error: 'Failed to list files' }, 500);
  }
});

const getFileRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Files'],
  request: {
    query: z.object({
      path: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: FileContentSchema
        }
      },
      description: 'Returns file content and metadata'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'File path is required or must be absolute'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'File not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to read file'
    }
  }
});

filesRouter.openapi(getFileRoute, async (c) => {
  try {
    const { path: filePath } = c.req.query();

    if (!filePath) {
      return c.json({ error: 'File path is required' }, 400);
    }

    if (!isAbsolute(filePath)) {
      return c.json({ error: 'Path must be absolute' }, 400);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.lstat(filePath);
    const isSymlink = stats.isSymbolicLink();
    const realPath = isSymlink ? await fs.realpath(filePath) : filePath;
    const extension = extname(filePath);

    return c.json({
      content,
      extension,
      isSymlink,
      realPath,
      path: filePath
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return c.json({ error: 'File not found' }, 404);
    }
    return c.json({ error: 'Failed to read file' }, 500);
  }
});

const updateFileRoute = createRoute({
  method: 'put',
  path: '/',
  tags: ['Files'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            path: z.string(),
            content: z.string()
          })
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            path: z.string()
          })
        }
      },
      description: 'File updated successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'File path is required, must be absolute, or content must be a string'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'File not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to write file'
    }
  }
});

filesRouter.openapi(updateFileRoute, async (c) => {
  try {
    const { path: filePath, content } = await c.req.json();

    if (!filePath) {
      return c.json({ error: 'File path is required' }, 400);
    }

    if (!isAbsolute(filePath)) {
      return c.json({ error: 'Path must be absolute' }, 400);
    }

    if (typeof content !== 'string') {
      return c.json({ error: 'Content must be a string' }, 400);
    }

    const stats = await fs.lstat(filePath);
    const targetPath = stats.isSymbolicLink() ? await fs.realpath(filePath) : filePath;

    await fs.writeFile(targetPath, content, 'utf-8');

    return c.json({ success: true, path: targetPath });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return c.json({ error: 'File not found' }, 404);
    }
    return c.json({ error: 'Failed to write file' }, 500);
  }
});
