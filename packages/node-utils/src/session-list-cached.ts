import { access, readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { JsonFileCache } from './cache.js';
import { CLAUDE_CODE_SESSION_COMPACTION_ID, ClaudeHelper } from './claude-helper.js';
import { BCC_SESSIONS_CACHE_DIR, getCompactionSummaryPath } from './monorepo-path-utils.js';
import {
  CLAUDE_CODE_COMMANDS,
  createMessageKey,
  extractTextContent,
  shouldSkipAssistantMessage,
  shouldSkipUserMessage
} from './session-helpers.js';
import type { SessionListItem, SessionListOptions, SessionListResult } from './session-list.js';
import { MessageCountMode, SessionSortBy, TitleSource } from './session-list.js';

const IGNORE_EMPTY_SESSIONS = true;
const MAX_TITLE_LENGTH = 80;
const TOKEN_LIMIT = 180000;
const CACHE_DIR = BCC_SESSIONS_CACHE_DIR;
const DEFAULT_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

const sessionCache = new JsonFileCache(CACHE_DIR);

export interface SessionCacheEntry {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  tokenPercentage?: number;
  imageCount?: number;
  customCommandCount?: number;
  filesOrFoldersCount?: number;
  urlCount?: number;
  labels?: string[];
  summary?: string;
  userMessageCount?: number;
  assistantMessageCount?: number;
  fileMtime: number;
  hasCompaction?: boolean;
}

interface ParsedLine {
  type: string;
  message?: {
    content?: unknown;
    usage?: {
      input_tokens?: number;
      cache_read_input_tokens?: number;
      output_tokens?: number;
    };
  };
  content?: unknown;
  timestamp?: number;
  sessionId?: string;
  summary?: string;
}

function parseCommandFromContent(content: string): string | null {
  const commandMatch = content.match(/<command-name>\/?([^<]+)<\/command-name>/);
  if (commandMatch) {
    const commandText = commandMatch[1];
    const argsMatch = content.match(/<command-args>([^<]+)<\/command-args>/);
    const args = argsMatch ? ` ${argsMatch[1]}` : '';
    return `/${commandText}${args}`;
  }
  return null;
}

function getLabelsFromSettings(
  settings: SessionListOptions['settings'],
  projectName: string,
  sessionId: string
): string[] | undefined {
  if (!settings) return undefined;

  const labels = settings.sessions.labels
    .filter((label) => label.sessions?.[projectName]?.includes(sessionId))
    .map((label) => label.id);

  return labels.length > 0 ? labels : undefined;
}

function singlePassParsing(
  lines: string[],
  options: {
    messageCountMode: MessageCountMode;
    titleSource: TitleSource;
    includeImages: boolean;
    includeCustomCommands: boolean;
    includeFilesOrFolders: boolean;
    includeUrls: boolean;
  }
) {
  const seenMessages = new Set<string>();
  let userCount = 0;
  let assistantCount = 0;
  let imageCount = 0;
  let customCommandCount = 0;
  let filesOrFoldersCount = 0;
  let urlCount = 0;
  let tokenPercentage: number | undefined;
  let summary: string | undefined;
  let firstUserMessage: string | null = null;
  let titleForFirstUserMessage: string | null = null;
  let titleForLastCCMessage: string | null = null;
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\]]+/g;
  let prevType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      const parsed: ParsedLine = JSON.parse(line);

      if (parsed.type === 'queue-operation') continue;
      if (parsed.summary) summary = parsed.summary;

      const isUser = ClaudeHelper.isUserMessage(parsed.type as any);
      const isCC = ClaudeHelper.isCCMessage(parsed.type as any);

      if (!isUser && !isCC) continue;

      const textContent = extractTextContent(parsed.message?.content || parsed.content);
      if (!textContent) continue;

      const messageKey = createMessageKey(isUser ? 'user' : 'assistant', parsed.timestamp, textContent);
      const isDuplicate = seenMessages.has(messageKey);
      if (!isDuplicate) seenMessages.add(messageKey);

      if (isUser) {
        if (!firstUserMessage) firstUserMessage = textContent;

        const shouldSkip = shouldSkipUserMessage(textContent);

        if (!isDuplicate && !shouldSkip) {
          if (options.messageCountMode === MessageCountMode.TURN) {
            if (parsed.type !== prevType) {
              userCount++;
              prevType = parsed.type;
            }
          } else {
            userCount++;
          }
        }

        if (!titleForFirstUserMessage && textContent !== 'Warmup') {
          const firstLine = textContent.split('\n')[0].replace(/\\/g, '').replace(/\s+/g, ' ').trim();
          if (!firstLine.includes('Caveat:')) {
            const parsedCommand = parseCommandFromContent(textContent);
            if (parsedCommand) {
              const commandMatch = textContent.match(/<command-name>\/?([^<]+)<\/command-name>/);
              const commandName = commandMatch?.[1];
              if (commandName && !CLAUDE_CODE_COMMANDS.includes(commandName)) {
                titleForFirstUserMessage = parsedCommand;
              }
            } else {
              const isSystemMessage =
                firstLine.startsWith('<local-command-') ||
                firstLine.startsWith('[Tool:') ||
                firstLine.startsWith('[Request interrupted');
              if (!isSystemMessage) {
                let title = textContent.replace(/\\/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                if (title.length > MAX_TITLE_LENGTH) {
                  title = `${title.substring(0, MAX_TITLE_LENGTH)}...`;
                }
                titleForFirstUserMessage = title;
              }
            }
          }
        }

        if (options.includeImages && !isDuplicate && !shouldSkip) {
          const messageContent = parsed.message?.content;
          if (Array.isArray(messageContent)) {
            for (const item of messageContent) {
              if (item.type === 'image') imageCount++;
            }
          }
        }

        if (options.includeCustomCommands) {
          const commandMatch = textContent.match(/<command-name>\/?([^<]+)<\/command-name>/);
          if (commandMatch) {
            const commandName = commandMatch[1];
            if (!CLAUDE_CODE_COMMANDS.includes(commandName)) {
              customCommandCount++;
            }
          }
        }

        if (options.includeFilesOrFolders) {
          const fileOrFolderMatches = textContent.match(/@[\w\-./]+/g);
          if (fileOrFolderMatches) filesOrFoldersCount += fileOrFolderMatches.length;
        }

        if (options.includeUrls) {
          const urlMatches = textContent.match(urlRegex);
          if (urlMatches) urlCount += urlMatches.length;
        }
      } else if (isCC) {
        const shouldSkip = shouldSkipAssistantMessage(textContent);

        if (!isDuplicate && !shouldSkip) {
          if (options.messageCountMode === MessageCountMode.TURN) {
            if (parsed.type !== prevType) {
              assistantCount++;
              prevType = parsed.type;
            }
          } else {
            assistantCount++;
          }
        }

        if (Array.isArray(parsed.message?.content)) {
          for (const item of parsed.message.content) {
            if (item.type === 'text' && item.text) {
              let title = item.text.replace(/\n/g, ' ').trim();
              if (title.length > MAX_TITLE_LENGTH) {
                title = `${title.substring(0, MAX_TITLE_LENGTH)}...`;
              }
              titleForLastCCMessage = title;
            }
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
          tokenPercentage = Math.floor((total * 100) / TOKEN_LIMIT);
        }
      }
    } catch {}
  }

  const title =
    options.titleSource === TitleSource.LAST_CC_MESSAGE
      ? titleForLastCCMessage || 'Empty session'
      : titleForFirstUserMessage || '';

  return {
    title,
    userCount,
    assistantCount,
    tokenPercentage,
    summary,
    firstUserMessage,
    imageCount,
    customCommandCount,
    filesOrFoldersCount,
    urlCount
  };
}

async function processSessionFileWithCache(
  filePath: string,
  file: string,
  projectName: string,
  options: {
    messageCountMode: MessageCountMode;
    titleSource: TitleSource;
    includeImages: boolean;
    includeCustomCommands: boolean;
    includeFilesOrFolders: boolean;
    includeUrls: boolean;
    includeLabels: boolean;
    settings?: SessionListOptions['settings'];
  }
): Promise<SessionCacheEntry | null> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  if (ClaudeHelper.isCompactionSession(lines)) return null;

  const result = singlePassParsing(lines, options);

  if (result.firstUserMessage?.startsWith(CLAUDE_CODE_SESSION_COMPACTION_ID)) {
    return null;
  }

  if (!result.title && IGNORE_EMPTY_SESSIONS) {
    return null;
  }

  const stats = await stat(filePath);
  const sessionId = file.replace('.jsonl', '');

  const entry: SessionCacheEntry = {
    id: sessionId,
    title: result.title || 'Empty session',
    messageCount: result.userCount + result.assistantCount,
    createdAt: stats.birthtimeMs,
    tokenPercentage: result.tokenPercentage,
    userMessageCount: result.userCount,
    assistantMessageCount: result.assistantCount,
    summary: result.summary,
    fileMtime: stats.mtimeMs
  };

  if (options.includeImages && result.imageCount > 0) {
    entry.imageCount = result.imageCount;
  }

  if (options.includeCustomCommands && result.customCommandCount > 0) {
    entry.customCommandCount = result.customCommandCount;
  }

  if (options.includeFilesOrFolders && result.filesOrFoldersCount > 0) {
    entry.filesOrFoldersCount = result.filesOrFoldersCount;
  }

  if (options.includeUrls && result.urlCount > 0) {
    entry.urlCount = result.urlCount;
  }

  if (options.includeLabels && options.settings) {
    const labels = getLabelsFromSettings(options.settings, projectName, sessionId);
    if (labels) entry.labels = labels;
  }

  const summaryPath = getCompactionSummaryPath(projectName, sessionId);
  try {
    await access(summaryPath);
    entry.hasCompaction = true;
  } catch {
    entry.hasCompaction = false;
  }

  return entry;
}

export async function listSessionsCached(
  options: SessionListOptions & { skipCache?: boolean; cacheTTL?: number }
): Promise<SessionListResult> {
  const {
    projectPath,
    limit = 20,
    sortBy = SessionSortBy.DATE,
    messageCountMode = MessageCountMode.EVENT,
    titleSource = TitleSource.FIRST_USER_MESSAGE,
    includeImages = false,
    includeCustomCommands = false,
    includeFilesOrFolders = false,
    includeUrls = false,
    includeLabels = false,
    skipCache = false,
    cacheTTL = DEFAULT_CACHE_TTL
  } = options;

  const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(projectPath);
  const sessionsPath = ClaudeHelper.getProjectDir(normalizedPath);

  const cacheKey = `project-${normalizedPath.replace(/\//g, '-')}`;
  const cachedData = skipCache ? {} : (await sessionCache.get<Record<string, SessionCacheEntry>>(cacheKey)) || {};

  const files = await readdir(sessionsPath);
  const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

  const fileMtimes = await Promise.all(
    sessionFiles.map(async (file) => {
      const stats = await stat(join(sessionsPath, file));
      return { file, mtime: stats.mtimeMs };
    })
  );

  const filesToProcess: string[] = [];
  const cachedSessions: Array<SessionCacheEntry & { wasCached: boolean }> = [];

  for (const { file, mtime } of fileMtimes) {
    const sessionId = file.replace('.jsonl', '');
    const cached = cachedData[sessionId];

    if (!cached || cached.fileMtime !== mtime) {
      filesToProcess.push(file);
    } else {
      cachedSessions.push({ ...cached, wasCached: true });
    }
  }

  const processOptions = {
    messageCountMode,
    titleSource,
    includeImages,
    includeCustomCommands,
    includeFilesOrFolders,
    includeUrls,
    includeLabels,
    settings: options.settings
  };

  const processedResults = await Promise.all(
    filesToProcess.map((file) =>
      processSessionFileWithCache(join(sessionsPath, file), file, normalizedPath, processOptions)
    )
  );

  const newSessions = (processedResults.filter((s) => s !== null) as SessionCacheEntry[]).map((s) => ({
    ...s,
    wasCached: false
  }));

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

  sessionCache.set(cacheKey, updatedCache, cacheTTL).catch(() => {});

  const allSessions = [...cachedSessions, ...newSessions];

  if (sortBy === SessionSortBy.TOKEN_PERCENTAGE) {
    allSessions.sort((a, b) => {
      const aToken = a.tokenPercentage ?? -1;
      const bToken = b.tokenPercentage ?? -1;
      return bToken - aToken;
    });
  } else {
    allSessions.sort((a, b) => b.createdAt - a.createdAt);
  }

  const items: SessionListItem[] = allSessions.slice(0, limit).map((session) => ({
    id: session.id,
    title: session.title,
    messageCount: session.messageCount,
    createdAt: session.createdAt,
    tokenPercentage: session.tokenPercentage,
    imageCount: session.imageCount,
    customCommandCount: session.customCommandCount,
    filesOrFoldersCount: session.filesOrFoldersCount,
    urlCount: session.urlCount,
    labels: session.labels,
    shortId: session.id.slice(-12),
    userMessageCount: session.userMessageCount,
    assistantMessageCount: session.assistantMessageCount,
    summary: session.summary,
    filePath: join(sessionsPath, `${session.id}.jsonl`),
    cached: session.wasCached,
    hasCompaction: session.hasCompaction
  }));

  return { items };
}

export { sessionCache };
