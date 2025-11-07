import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ClaudeHelper } from '@better-claude-code/node-utils';
import { CLAUDE_CODE_SESSION_COMPACTION_ID } from '@better-claude-code/shared';
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { ErrorSchema, PaginationMetaSchema } from '../../../common/schemas.js';
import { extractTextContent, parseCommandFromContent } from '../utils.js';

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

    const sessionsPath = ClaudeHelper.getProjectDir(projectName);
    const files = readdirSync(sessionsPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    const sessions: any[] = [];

    for (const file of sessionFiles) {
      const filePath = join(sessionsPath, file);
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      if (ClaudeHelper.isCompactionSession(lines, CLAUDE_CODE_SESSION_COMPACTION_ID)) continue;

      const events = lines.map((line) => JSON.parse(line));
      const messages = events.filter((e: any) => e.type === 'user' || e.type === 'assistant');

      let tokenPercentage: number | undefined;
      for (let j = lines.length - 1; j >= 0; j--) {
        try {
          const parsed = JSON.parse(lines[j]);
          const usage = parsed.message?.usage;
          if (usage) {
            const inputTokens = usage.input_tokens || 0;
            const cacheReadTokens = usage.cache_read_input_tokens || 0;
            const outputTokens = usage.output_tokens || 0;
            const total = inputTokens + cacheReadTokens + outputTokens;

            if (total > 0) {
              tokenPercentage = Math.floor((total * 100) / 180000);
              break;
            }
          }
        } catch {}
      }

      let title = '';
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'user') {
            const content = extractTextContent(parsed.message?.content);
            if (content && content !== 'Warmup' && !content.includes('Caveat:')) {
              const parsedCommand = parseCommandFromContent(content);
              if (parsedCommand) {
                title = parsedCommand;
              } else {
                title = content.replace(/\\/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
              }

              if (title.length > 80) {
                title = `${title.substring(0, 80)}...`;
              }
              break;
            }
          }
        } catch {}
      }

      if (!title) {
        continue;
      }

      let searchMatchCount: number | undefined;

      if (search) {
        const searchLower = search.toLowerCase();
        const titleMatch = title.toLowerCase().includes(searchLower);
        const contentLower = content.toLowerCase();
        const contentMatches = contentLower.split(searchLower).length - 1;

        if (!titleMatch && contentMatches === 0) {
          continue;
        }

        searchMatchCount = contentMatches + (titleMatch ? 1 : 0);
      }

      const stats = statSync(filePath);

      let imageCount = 0;
      let customCommandCount = 0;
      let filesOrFoldersCount = 0;

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const messageContent = parsed.message?.content;

          if (Array.isArray(messageContent)) {
            for (const item of messageContent) {
              if (item.type === 'image') {
                imageCount++;
              }
            }
          }

          if (parsed.type === 'user') {
            const content = extractTextContent(parsed.message?.content);
            if (content) {
              const commandMatch = content.match(/<command-name>\/?([^<]+)<\/command-name>/);
              if (commandMatch) {
                customCommandCount++;
              }

              const fileOrFolderMatches = content.match(/\/([\w\-./]+)/g);
              if (fileOrFolderMatches) {
                filesOrFoldersCount += fileOrFolderMatches.length;
              }
            }
          }
        } catch {}
      }

      const sessionId = file.replace('.jsonl', '');
      const metadataPath = join(sessionsPath, '.metadata', `${sessionId}.json`);

      let labels: string[] | undefined;
      try {
        const metadataContent = readFileSync(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataContent);
        labels = metadata.labels?.length > 0 ? metadata.labels : undefined;
      } catch {}

      sessions.push({
        id: sessionId,
        title,
        messageCount: messages.length,
        createdAt: stats.birthtimeMs,
        tokenPercentage,
        searchMatchCount,
        imageCount: imageCount > 0 ? imageCount : undefined,
        customCommandCount: customCommandCount > 0 ? customCommandCount : undefined,
        filesOrFoldersCount: filesOrFoldersCount > 0 ? filesOrFoldersCount : undefined,
        labels
      });
    }

    if (sortBy === 'token-percentage') {
      sessions.sort((a, b) => {
        const aToken = a.tokenPercentage ?? -1;
        const bToken = b.tokenPercentage ?? -1;
        return bToken - aToken;
      });
    } else {
      sessions.sort((a, b) => b.createdAt - a.createdAt);
    }

    const totalItems = sessions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSessions = sessions.slice(startIndex, endIndex);

    return c.json(
      {
        items: paginatedSessions,
        meta: {
          totalItems,
          totalPages,
          page,
          limit
        }
      } satisfies z.infer<typeof responseSchema>,
      200
    );
  } catch {
    return c.json({ error: 'Failed to read sessions' } satisfies z.infer<typeof ErrorSchema>, 500);
  }
};
