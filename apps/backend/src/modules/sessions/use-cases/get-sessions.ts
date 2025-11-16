import { existsSync } from 'node:fs';
import {
  ClaudeHelper,
  type GroupBy,
  groupSessions,
  listSessionsCached,
  MessageCountMode,
  SessionSortBy,
  TitleSource
} from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema } from '../../../common/schemas.js';
import { readSettings } from '../../settings/utils.js';

const paramsSchema = z.object({
  projectName: z.string()
});

const querySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional().default(''),
  groupBy: z.enum(['date', 'token-percentage', 'label']).default('date'),
  skipCache: z.coerce.boolean().optional().default(false)
});

const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  messageCount: z.number(),
  createdAt: z.string(),
  modifiedAt: z.string(),
  tokenPercentage: z.number().optional(),
  searchMatchCount: z.number().optional(),
  imageCount: z.number().optional(),
  customCommandCount: z.number().optional(),
  filesOrFoldersCount: z.number().optional(),
  urlCount: z.number().optional(),
  labels: z.array(z.string()).optional(),
  summary: z.string().optional(),
  cached: z.boolean()
});

const GroupSchema = z.object({
  key: z.string(),
  label: z.string(),
  color: z.string().nullable().optional(),
  items: z.array(SessionSchema),
  totalItems: z.number()
});

const responseSchema = z.object({
  groups: z.array(GroupSchema),
  meta: z.object({
    totalItems: z.number(),
    totalGroups: z.number()
  })
});

const ResponseSchemas = {
  200: {
    content: {
      'application/json': {
        schema: responseSchema
      }
    },
    description: 'Returns paginated sessions'
  },
  500: {
    content: {
      'application/json': {
        schema: ErrorSchema
      }
    },
    description: 'Failed to read sessions'
  }
} as const;

export const route = createRoute({
  method: 'get',
  path: '/{projectName}',
  tags: ['Sessions'],
  request: {
    params: paramsSchema,
    query: querySchema
  },
  responses: ResponseSchemas
});

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectName } = c.req.valid('param');
    const { groupBy, skipCache } = c.req.valid('query');

    const settings = await readSettings();
    const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(projectName);
    const sessionsPath = ClaudeHelper.getProjectDir(normalizedPath);

    if (!existsSync(sessionsPath)) {
      return c.json({ error: 'Project directory not found' } satisfies z.infer<typeof ErrorSchema>, 500);
    }

    const result = await listSessionsCached({
      projectPath: projectName,
      limit: 1000,
      sortBy: SessionSortBy.DATE,
      messageCountMode: MessageCountMode.TURN,
      titleSource: TitleSource.FIRST_USER_MESSAGE,
      includeImages: true,
      includeCustomCommands: true,
      includeFilesOrFolders: true,
      includeUrls: true,
      includeLabels: true,
      skipCache,
      settings
    });

    const items = result.items.map((session) => ({
      id: session.id,
      title: session.title,
      messageCount: session.messageCount,
      createdAt: new Date(session.createdAt).toISOString(),
      modifiedAt: new Date(session.createdAt).toISOString(),
      tokenPercentage: session.tokenPercentage,
      imageCount: session.imageCount,
      customCommandCount: session.customCommandCount,
      filesOrFoldersCount: session.filesOrFoldersCount,
      urlCount: session.urlCount,
      labels: session.labels,
      summary: session.summary,
      cached: session.cached ?? false
    }));

    const groups = groupSessions({
      sessions: items,
      groupBy: groupBy as GroupBy,
      settings,
      getCreatedAt: (session) => new Date(session.createdAt),
      getModifiedAt: (session) => new Date(session.modifiedAt),
      getTokenPercentage: (session) => session.tokenPercentage,
      getLabels: (session) => session.labels
    });

    return c.json(
      {
        groups,
        meta: {
          totalItems: items.length,
          totalGroups: groups.length
        }
      } satisfies z.infer<typeof responseSchema>,
      200
    );
  } catch {
    return c.json({ error: 'Failed to read sessions' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
