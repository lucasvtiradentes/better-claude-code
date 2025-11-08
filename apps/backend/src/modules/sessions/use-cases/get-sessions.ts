import { listSessions, SessionSortBy } from '@better-claude-code/node-utils';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, PaginationMetaSchema } from '../../../common/schemas.js';

const paramsSchema = z.object({
  projectName: z.string()
});

const querySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional().default(''),
  sortBy: z.string().optional().default('date')
});

const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  messageCount: z.number(),
  createdAt: z.number(),
  tokenPercentage: z.number().optional(),
  searchMatchCount: z.number().optional(),
  imageCount: z.number().optional(),
  customCommandCount: z.number().optional(),
  filesOrFoldersCount: z.number().optional(),
  labels: z.array(z.string()).optional()
});

const responseSchema = z.object({
  items: z.array(SessionSchema),
  meta: PaginationMetaSchema
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
    const { page, limit, search, sortBy } = c.req.valid('query');

    const result = await listSessions({
      projectPath: projectName,
      limit,
      page,
      search,
      sortBy: sortBy === 'token-percentage' ? SessionSortBy.TOKEN_PERCENTAGE : SessionSortBy.DATE,
      includeImages: true,
      includeCustomCommands: true,
      includeFilesOrFolders: true,
      includeLabels: true,
      enablePagination: true
    });

    const items = result.items.map((item) => ({
      id: item.id,
      title: item.title,
      messageCount: item.messageCount,
      createdAt: item.createdAt,
      tokenPercentage: item.tokenPercentage,
      searchMatchCount: item.searchMatchCount,
      imageCount: item.imageCount,
      customCommandCount: item.customCommandCount,
      filesOrFoldersCount: item.filesOrFoldersCount,
      labels: item.labels
    }));

    return c.json(
      {
        items,
        meta: result.meta!
      } satisfies z.infer<typeof responseSchema>,
      200
    );
  } catch {
    return c.json({ error: 'Failed to read sessions' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
