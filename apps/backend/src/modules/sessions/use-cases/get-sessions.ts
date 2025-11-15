import { existsSync } from 'node:fs';
import {
  ClaudeHelper,
  listSessionsCached,
  MessageCountMode,
  SessionSortBy,
  TitleSource
} from '@better-claude-code/node-utils';
import {
  getTimeGroup,
  getTokenPercentageGroup,
  TIME_GROUP_LABELS,
  TIME_GROUP_ORDER,
  TOKEN_PERCENTAGE_GROUP_LABELS,
  TOKEN_PERCENTAGE_GROUP_ORDER
} from '@better-claude-code/shared';
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
      cached: false
    }));

    const grouped: Record<string, typeof items> = {};

    if (groupBy === 'date') {
      items.forEach((session) => {
        const groupKey = getTimeGroup(new Date(session.createdAt).getTime());
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(session);
      });

      const groups = TIME_GROUP_ORDER.map((key) => ({
        key,
        label: TIME_GROUP_LABELS[key as keyof typeof TIME_GROUP_LABELS],
        color: null,
        items: (grouped[key] || []).sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()),
        totalItems: grouped[key]?.length || 0
      })).filter((g) => g.totalItems > 0);

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
    }

    if (groupBy === 'token-percentage') {
      items.forEach((session) => {
        const groupKey = getTokenPercentageGroup(session.tokenPercentage);
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(session);
      });

      const groups = TOKEN_PERCENTAGE_GROUP_ORDER.map((key) => ({
        key,
        label: TOKEN_PERCENTAGE_GROUP_LABELS[key as keyof typeof TOKEN_PERCENTAGE_GROUP_LABELS],
        color: null,
        items: (grouped[key] || []).sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()),
        totalItems: grouped[key]?.length || 0
      })).filter((g) => g.totalItems > 0);

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
    }

    if (groupBy === 'label') {
      grouped['no-label'] = [];

      items.forEach((session) => {
        if (!session.labels || session.labels.length === 0) {
          grouped['no-label'].push(session);
        } else {
          session.labels.forEach((labelId) => {
            if (!grouped[labelId]) grouped[labelId] = [];
            grouped[labelId].push(session);
          });
        }
      });

      const labelIds = settings.sessions.labels.map((l) => l.id);
      const groups = [...labelIds, 'no-label']
        .map((key) => {
          const label = settings.sessions.labels.find((l) => l.id === key);
          return {
            key,
            label: key === 'no-label' ? 'No Label' : label?.name || key,
            color: label?.color || null,
            items: (grouped[key] || []).sort(
              (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
            ),
            totalItems: grouped[key]?.length || 0
          };
        })
        .filter((g) => g.totalItems > 0);

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
    }

    return c.json(
      {
        groups: [],
        meta: {
          totalItems: 0,
          totalGroups: 0
        }
      } satisfies z.infer<typeof responseSchema>,
      200
    );
  } catch {
    return c.json({ error: 'Failed to read sessions' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
