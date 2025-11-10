import { existsSync, readFile } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { ClaudeHelper } from '@better-claude-code/node-utils';
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
import { type SessionCacheEntry, sessionsCache } from '../cache.js';

const paramsSchema = z.object({
  projectName: z.string()
});

const querySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional().default(''),
  groupBy: z.enum(['date', 'token-percentage', 'label']).default('date')
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

async function processSessionFileWithCache(
  filePath: string,
  file: string,
  normalizedPath: string,
  settings: Awaited<ReturnType<typeof readSettings>>
): Promise<SessionCacheEntry | null> {
  try {
    const stats = await stat(filePath);
    const content = await new Promise<string>((resolve, reject) => {
      readFile(filePath, 'utf-8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const lines = content.trim().split('\n').filter(Boolean);

    if (ClaudeHelper.isCompactionSession(lines)) return null;

    let title = '';
    let messageCount = 0;
    let tokenPercentage = 0;
    let summary: string | undefined;
    let imageCount = 0;
    let filesOrFoldersCount = 0;
    let urlCount = 0;
    const labels: string[] = [];
    const sessionId = file.replace('.jsonl', '');

    const seenMessages = new Set<string>();

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);

        if (parsed.type === 'queue-operation') continue;
        if (parsed.summary) summary = parsed.summary;

        const isUser = ClaudeHelper.isUserMessage(parsed.type);
        const isCC = ClaudeHelper.isCCMessage(parsed.type);

        if (!isUser && !isCC) continue;

        const textContent = parsed.message?.content || parsed.content;
        if (!textContent) continue;

        const messageKey = `${isUser ? 'user' : 'assistant'}-${parsed.timestamp || 0}`;
        if (seenMessages.has(messageKey)) continue;
        seenMessages.add(messageKey);

        messageCount++;

        if (isUser && !title && typeof textContent === 'string') {
          const firstLine = textContent.split('\n')[0].replace(/\\/g, '').replace(/\s+/g, ' ').trim();
          if (firstLine && firstLine !== 'Warmup' && !firstLine.includes('Caveat:')) {
            title = firstLine.length > 80 ? `${firstLine.substring(0, 80)}...` : firstLine;
          }

          const fileOrFolderMatches = textContent.match(/@[\w\-./]+/g);
          if (fileOrFolderMatches) filesOrFoldersCount += fileOrFolderMatches.length;

          const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\]]+/g;
          const urlMatches = textContent.match(urlRegex);
          if (urlMatches) urlCount += urlMatches.length;

          if (Array.isArray(parsed.message?.content)) {
            for (const item of parsed.message.content) {
              if (item.type === 'image') imageCount++;
            }
          }
        }

        const usage = parsed.message?.usage;
        if (usage) {
          const inputTokens = usage.input_tokens || 0;
          const cacheReadTokens = usage.cache_read_input_tokens || 0;
          const outputTokens = usage.output_tokens || 0;
          const total = inputTokens + cacheReadTokens + outputTokens;
          if (total > 0) {
            tokenPercentage = Math.floor((total * 100) / 180000);
          }
        }
      } catch {}
    }

    if (settings?.sessions?.labels) {
      for (const label of settings.sessions.labels) {
        if (label.sessions?.[normalizedPath]?.includes(sessionId)) {
          labels.push(label.id);
        }
      }
    }

    if (!title) return null;

    return {
      id: sessionId,
      title,
      messageCount,
      createdAt: stats.birthtimeMs,
      tokenPercentage,
      imageCount: imageCount > 0 ? imageCount : undefined,
      filesOrFoldersCount: filesOrFoldersCount > 0 ? filesOrFoldersCount : undefined,
      urlCount: urlCount > 0 ? urlCount : undefined,
      labels: labels.length > 0 ? labels : undefined,
      summary,
      fileMtime: stats.mtimeMs
    };
  } catch {
    return null;
  }
}

export const handler: RouteHandler<typeof route> = async (c) => {
  try {
    const { projectName } = c.req.valid('param');
    const { groupBy } = c.req.valid('query');

    const settings = await readSettings();
    const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(projectName);
    const sessionsPath = ClaudeHelper.getProjectDir(normalizedPath);

    if (!existsSync(sessionsPath)) {
      return c.json({ error: 'Project directory not found' } satisfies z.infer<typeof ErrorSchema>, 500);
    }

    const cacheKey = `project-${normalizedPath.replace(/\//g, '-')}`;
    const cachedData = (await sessionsCache.get<Record<string, SessionCacheEntry>>(cacheKey)) || {};

    const files = await readdir(sessionsPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    const fileMtimes = await Promise.all(
      sessionFiles.map(async (file) => {
        const stats = await stat(join(sessionsPath, file));
        return { file, mtime: stats.mtimeMs };
      })
    );

    const filesToProcess: string[] = [];
    const cachedSessions: (SessionCacheEntry & { isCached: boolean })[] = [];

    for (const { file, mtime } of fileMtimes) {
      const sessionId = file.replace('.jsonl', '');
      const cached = cachedData[sessionId];

      if (!cached || cached.fileMtime !== mtime) {
        filesToProcess.push(file);
      } else {
        cachedSessions.push({ ...cached, isCached: true });
      }
    }

    const processedResults = await Promise.all(
      filesToProcess.map((file) =>
        processSessionFileWithCache(join(sessionsPath, file), file, normalizedPath, settings)
      )
    );

    const newSessions = processedResults.filter((s) => s !== null) as SessionCacheEntry[];
    const newSessionsWithFlag = newSessions.map(s => ({ ...s, isCached: false }));

    const updatedCache = { ...cachedData };
    for (const session of newSessions) {
      updatedCache[session.id] = session;
    }

    const existingFileSet = new Set(sessionFiles.map((f) => f.replace('.jsonl', '')));
    for (const cachedId of Object.keys(updatedCache)) {
      if (!existingFileSet.has(cachedId)) {
        delete updatedCache[cachedId];
      }
    }

    sessionsCache.set(cacheKey, updatedCache, 30 * 24 * 60 * 60 * 1000).catch(() => {});

    const items = [...cachedSessions, ...newSessionsWithFlag].map(({ fileMtime, isCached, ...rest }) => ({ ...rest, cached: isCached }));

    const grouped: Record<string, typeof items> = {};

    if (groupBy === 'date') {
      items.forEach((session) => {
        const groupKey = getTimeGroup(session.createdAt);
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(session);
      });

      const groups = TIME_GROUP_ORDER.map((key) => ({
        key,
        label: TIME_GROUP_LABELS[key as keyof typeof TIME_GROUP_LABELS],
        color: null,
        items: grouped[key] || [],
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
        items: grouped[key] || [],
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
            items: grouped[key] || [],
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
