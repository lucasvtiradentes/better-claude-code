import { accessSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, SuccessSchema } from '../../../common/schemas.js';
import { readSettings, writeSettings } from '../../settings/utils.js';

const paramsSchema = z.object({
  projectId: z.string()
});

const bodySchema = z.object({
  labelId: z.string()
});

const responseSchema = SuccessSchema;

export const route = createRoute({
  method: 'post',
  path: '/projects/{projectId}/labels/toggle',
  tags: ['Projects'],
  request: {
    params: paramsSchema,
    body: {
      content: {
        'application/json': {
          schema: bodySchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Toggle project label',
      content: {
        'application/json': {
          schema: responseSchema
        }
      }
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    }
  }
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectId } = c.req.valid('param');
    const { labelId } = c.req.valid('json');

    const projectsDir = ClaudeHelper.getProjectsDir();
    const projectPath = join(projectsDir, projectId);
    const metadataDir = join(projectPath, '.metadata');
    const metadataFile = join(metadataDir, 'project.json');

    try {
      accessSync(metadataDir);
    } catch {
      mkdirSync(metadataDir, { recursive: true });
    }

    let metadata: { labels?: string[] } = {};
    try {
      const content = readFileSync(metadataFile, 'utf-8');
      metadata = JSON.parse(content);
    } catch {
      metadata = { labels: [] };
    }

    if (!metadata.labels) {
      metadata.labels = [];
    }

    const hasLabel = metadata.labels.includes(labelId);
    if (hasLabel) {
      metadata.labels = metadata.labels.filter((id) => id !== labelId);
    } else {
      metadata.labels = [labelId];
    }

    writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    const settings = await readSettings();
    const label = settings.projects.labels.find((l) => l.id === labelId);

    if (label) {
      if (!label.projects) {
        label.projects = [];
      }

      if (hasLabel) {
        label.projects = label.projects.filter((id) => id !== projectId);
      } else {
        if (!label.projects.includes(projectId)) {
          label.projects.push(projectId);
        }
      }

      await writeSettings(settings);
    }

    return c.json({ success: true } satisfies z.infer<typeof responseSchema>, 200);
  } catch {
    return c.json({ error: 'Failed to toggle project label' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
