import { accessSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, SuccessSchema } from '../../../common/schemas.js';
import { readSettings, writeSettings } from '../utils.js';

const paramsSchema = z.object({
  labelId: z.string()
});

const responseSchema = SuccessSchema;

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Session label deleted successfully'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to delete label'
  }
} as const;

export const route = createRoute({
  method: 'delete',
  path: '/sessions/labels/{labelId}',
  tags: ['Settings'],
  request: {
    params: paramsSchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { labelId } = c.req.valid('param');
    const settings = await readSettings();

    settings.sessions.labels = settings.sessions.labels.filter((l) => l.id !== labelId);

    const sessionsDir = ClaudeHelper.getProjectsDir();
    try {
      accessSync(sessionsDir);
      const projects = readdirSync(sessionsDir, { withFileTypes: true }).filter((dirent) => dirent.isDirectory());

      for (const project of projects) {
        const projectPath = join(sessionsDir, project.name);
        const metadataDir = join(projectPath, '.metadata');

        try {
          accessSync(metadataDir);
          const metadataFiles = readdirSync(metadataDir).filter((file) => file.endsWith('.json'));

          for (const metadataFile of metadataFiles) {
            const metadataPath = join(metadataDir, metadataFile);
            try {
              const content = readFileSync(metadataPath, 'utf-8');
              const metadata = JSON.parse(content) as { labels?: string[] };

              if (metadata?.labels?.includes(labelId)) {
                metadata.labels = metadata.labels.filter((id) => id !== labelId);
                writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
              }
            } catch {}
          }
        } catch {}
      }
    } catch {
      // Sessions directory doesn't exist or is not accessible
    }

    await writeSettings(settings);
    return c.json({ success: true } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to delete label' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
