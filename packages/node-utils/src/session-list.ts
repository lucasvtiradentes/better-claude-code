import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { CLAUDE_CODE_SESSION_COMPACTION_ID, ClaudeHelper } from './claude-helper.js';
import { getCompactionSummaryPath } from './monorepo-path-utils.js';
import {
  CLAUDE_CODE_COMMANDS,
  createMessageKey,
  extractTextContent,
  shouldSkipAssistantMessage,
  shouldSkipUserMessage
} from './session-helpers.js';

const IGNORE_EMPTY_SESSIONS = true;
const MAX_TITLE_LENGTH = 80;
const TOKEN_LIMIT = 180000;

export enum MessageCountMode {
  TURN = 'turn',
  EVENT = 'event'
}

export enum TitleSource {
  FIRST_USER_MESSAGE = 'first_user_message',
  LAST_CC_MESSAGE = 'last_cc_message'
}

export enum SessionSortBy {
  DATE = 'date',
  TOKEN_PERCENTAGE = 'tokenPercentage'
}

export interface SessionListOptions {
  projectPath: string;
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: SessionSortBy;
  messageCountMode?: MessageCountMode;
  titleSource?: TitleSource;
  includeImages?: boolean;
  includeCustomCommands?: boolean;
  includeFilesOrFolders?: boolean;
  includeUrls?: boolean;
  includeLabels?: boolean;
  enablePagination?: boolean;
  settings?: {
    sessions: {
      labels: Array<{
        id: string;
        sessions?: Record<string, string[]>;
      }>;
    };
  };
}

export interface SessionListItem {
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
  searchMatchCount?: number;
  filePath?: string;
  shortId?: string;
  userMessageCount?: number;
  assistantMessageCount?: number;
  summary?: string;
  cached?: boolean;
  hasCompaction?: boolean;
}

export interface SessionListResult {
  items: SessionListItem[];
  meta?: {
    totalItems: number;
    totalPages: number;
    page: number;
    limit: number;
  };
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

async function findCheckpointedSessions(sessionFiles: string[], sessionsPath: string): Promise<Set<string>> {
  const originalSessionsToHide = new Set<string>();

  const checkPromises = sessionFiles.map(async (file) => {
    const filePath = join(sessionsPath, file);
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());

    let summary: string | undefined;
    let internalSessionId: string | undefined;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      try {
        const parsed = JSON.parse(line);
        if (!summary && parsed.type === 'summary' && parsed.summary) {
          summary = parsed.summary;
        }
        if (!internalSessionId && parsed.sessionId) {
          internalSessionId = parsed.sessionId;
        }
        if (summary && internalSessionId) break;
      } catch {}
    }

    if (summary && internalSessionId && internalSessionId !== file.replace('.jsonl', '')) {
      return internalSessionId;
    }

    return null;
  });

  const results = await Promise.all(checkPromises);
  results.forEach((sessionId: string | null) => {
    if (sessionId) {
      originalSessionsToHide.add(sessionId);
    }
  });

  return originalSessionsToHide;
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

function singlePassParsing(
  lines: string[],
  options: {
    search: string;
    messageCountMode: MessageCountMode;
    titleSource: TitleSource;
    includeImages: boolean;
    includeCustomCommands: boolean;
    includeFilesOrFolders: boolean;
    includeUrls: boolean;
  }
) {
  const parsedLines: ParsedLine[] = [];
  const seenMessages = new Set<string>();
  let userCount = 0;
  let assistantCount = 0;
  let imageCount = 0;
  let customCommandCount = 0;
  let filesOrFoldersCount = 0;
  let urlCount = 0;
  let tokenPercentage: number | undefined;
  let summary: string | undefined;
  let internalSessionId: string | undefined;
  let firstUserMessage: string | null = null;
  let titleForFirstUserMessage: string | null = null;
  let titleForLastCCMessage: string | null = null;
  let searchMatchCount: number | undefined;
  let contentMatches = 0;
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\]]+/g;
  let prevType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      const parsed: ParsedLine = JSON.parse(line);
      parsedLines.push(parsed);

      if (parsed.type === 'queue-operation') continue;
      if (parsed.summary) summary = parsed.summary;
      if (parsed.sessionId) internalSessionId = parsed.sessionId;

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

        if (options.search) {
          const matches = textContent.toLowerCase().split(options.search.toLowerCase()).length - 1;
          contentMatches += matches;
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

        if (options.search) {
          const matches = textContent.toLowerCase().split(options.search.toLowerCase()).length - 1;
          contentMatches += matches;
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

  if (options.search) {
    const titleMatch = title.toLowerCase().includes(options.search.toLowerCase());
    if (!titleMatch && contentMatches === 0) {
      return null;
    }
    searchMatchCount = contentMatches + (titleMatch ? 1 : 0);
  }

  return {
    parsedLines,
    title,
    userCount,
    assistantCount,
    tokenPercentage,
    summary,
    internalSessionId,
    firstUserMessage,
    imageCount,
    customCommandCount,
    filesOrFoldersCount,
    urlCount,
    searchMatchCount
  };
}

async function processSessionFile(
  filePath: string,
  file: string,
  projectName: string,
  options: {
    search: string;
    messageCountMode: MessageCountMode;
    titleSource: TitleSource;
    includeImages: boolean;
    includeCustomCommands: boolean;
    includeFilesOrFolders: boolean;
    includeUrls: boolean;
    includeLabels: boolean;
    settings?: SessionListOptions['settings'];
  }
): Promise<SessionListItem | null> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  if (ClaudeHelper.isCompactionSession(lines)) return null;

  const result = singlePassParsing(lines, options);
  if (!result) return null;

  if (result.firstUserMessage?.startsWith(CLAUDE_CODE_SESSION_COMPACTION_ID)) {
    return null;
  }

  if (!result.title && IGNORE_EMPTY_SESSIONS) {
    return null;
  }

  const stats = await stat(filePath);
  const sessionId = file.replace('.jsonl', '');

  const session: SessionListItem = {
    id: sessionId,
    title: result.title || 'Empty session',
    messageCount: result.userCount + result.assistantCount,
    createdAt: stats.birthtimeMs,
    tokenPercentage: result.tokenPercentage,
    searchMatchCount: result.searchMatchCount,
    filePath,
    shortId: sessionId.slice(-12),
    userMessageCount: result.userCount,
    assistantMessageCount: result.assistantCount,
    summary: result.summary
  };

  if (options.includeImages && result.imageCount > 0) {
    session.imageCount = result.imageCount;
  }

  if (options.includeCustomCommands && result.customCommandCount > 0) {
    session.customCommandCount = result.customCommandCount;
  }

  if (options.includeFilesOrFolders && result.filesOrFoldersCount > 0) {
    session.filesOrFoldersCount = result.filesOrFoldersCount;
  }

  if (options.includeUrls && result.urlCount > 0) {
    session.urlCount = result.urlCount;
  }

  if (options.includeLabels && options.settings) {
    const labels = getLabelsFromSettings(options.settings, projectName, sessionId);
    if (labels) session.labels = labels;
  }

  const compactionSummaryPath = getCompactionSummaryPath(projectName, sessionId);
  if (existsSync(compactionSummaryPath)) {
    session.hasCompaction = true;
  }

  return session;
}

export async function listSessions(options: SessionListOptions): Promise<SessionListResult> {
  const {
    projectPath,
    limit = 20,
    page = 1,
    search = '',
    sortBy = SessionSortBy.DATE,
    messageCountMode = MessageCountMode.EVENT,
    titleSource = TitleSource.FIRST_USER_MESSAGE,
    includeImages = false,
    includeCustomCommands = false,
    includeFilesOrFolders = false,
    includeUrls = false,
    includeLabels = false,
    enablePagination = false
  } = options;

  const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(projectPath);
  const sessionsPath = ClaudeHelper.getProjectDir(normalizedPath);

  if (!existsSync(sessionsPath)) {
    throw new Error(`Project directory not found: ${sessionsPath}`);
  }

  const files = await readdir(sessionsPath);
  let sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

  const checkpointedOriginals =
    sessionFiles.length <= 50 ? await findCheckpointedSessions(sessionFiles, sessionsPath) : new Set<string>();
  sessionFiles = sessionFiles.filter((f) => !checkpointedOriginals.has(f.replace('.jsonl', '')));
  const processOptions = {
    search,
    messageCountMode,
    titleSource,
    includeImages,
    includeCustomCommands,
    includeFilesOrFolders,
    includeUrls,
    includeLabels,
    settings: options.settings
  };

  let sessions: SessionListItem[];

  if (!search && sortBy === SessionSortBy.DATE) {
    const fileStatsPromises = sessionFiles.map(async (file) => {
      const filePath = join(sessionsPath, file);
      const stats = await stat(filePath);
      return { file, filePath, birthtimeMs: stats.birthtimeMs };
    });

    const fileStats = await Promise.all(fileStatsPromises);
    fileStats.sort((a, b) => b.birthtimeMs - a.birthtimeMs);

    if (enablePagination) {
      const sessionPromises = fileStats.map(({ file, filePath }) =>
        processSessionFile(filePath, file, normalizedPath, processOptions)
      );

      const sessionsResults = await Promise.all(sessionPromises);
      const allValidSessions = sessionsResults.filter((s) => s !== null) as SessionListItem[];

      const totalItems = allValidSessions.length;
      const totalPages = Math.ceil(totalItems / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSessions = allValidSessions.slice(startIndex, endIndex);

      return {
        items: paginatedSessions,
        meta: {
          totalItems,
          totalPages,
          page,
          limit
        }
      };
    }

    const validSessions: SessionListItem[] = [];

    for (const { file, filePath } of fileStats) {
      if (validSessions.length >= limit) break;

      const session = await processSessionFile(filePath, file, normalizedPath, processOptions);

      if (session !== null) {
        validSessions.push(session);
      }
    }

    return { items: validSessions };
  }

  const sessionPromises = sessionFiles.map((file) => {
    const filePath = join(sessionsPath, file);
    return processSessionFile(filePath, file, normalizedPath, processOptions);
  });

  const sessionsResults = await Promise.all(sessionPromises);
  sessions = sessionsResults.filter((s) => s !== null) as SessionListItem[];

  if (sortBy === SessionSortBy.TOKEN_PERCENTAGE) {
    sessions.sort((a, b) => {
      const aToken = a.tokenPercentage ?? -1;
      const bToken = b.tokenPercentage ?? -1;
      return bToken - aToken;
    });
  } else {
    sessions.sort((a, b) => b.createdAt - a.createdAt);
  }

  if (enablePagination) {
    const totalItems = sessions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSessions = sessions.slice(startIndex, endIndex);

    return {
      items: paginatedSessions,
      meta: {
        totalItems,
        totalPages,
        page,
        limit
      }
    };
  }

  const limitedSessions = sessions.slice(0, limit);
  return { items: limitedSessions };
}
