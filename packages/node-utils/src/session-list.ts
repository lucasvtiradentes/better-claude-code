import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { CLAUDE_CODE_SESSION_COMPACTION_ID, ClaudeHelper } from './claude-helper.js';

const IGNORE_EMPTY_SESSIONS = true;
const MAX_TITLE_LENGTH = 80;
const TOKEN_LIMIT = 180000;
const CLAUDE_CODE_COMMANDS = ['clear', 'ide', 'model', 'compact', 'init'];

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

function extractTextContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join(' ');
  }
  return '';
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

function isValidUserMessage(content: string): boolean {
  if (!content || content === 'Warmup') {
    return false;
  }

  const firstLine = content.split('\n')[0].replace(/\\/g, '').replace(/\s+/g, ' ').trim();

  if (firstLine.includes('Caveat:')) {
    return false;
  }

  const commandMatch = content.match(/<command-name>\/?([^<]+)<\/command-name>/);
  if (commandMatch) {
    const commandName = commandMatch[1];
    if (CLAUDE_CODE_COMMANDS.includes(commandName)) {
      return false;
    }
  }

  const isSystemMessage =
    firstLine.startsWith('<local-command-') ||
    firstLine.startsWith('[Tool:') ||
    firstLine.startsWith('[Request interrupted');

  return !isSystemMessage;
}

function countMessages(
  lines: string[],
  mode: MessageCountMode
): { userCount: number; assistantCount: number; totalCount: number } {
  if (mode === MessageCountMode.TURN) {
    let userCount = 0;
    let assistantCount = 0;
    let prevType = '';

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const currentType = parsed.type;

        if (ClaudeHelper.isUserMessage(currentType) || ClaudeHelper.isCCMessage(currentType)) {
          if (ClaudeHelper.isUserMessage(currentType)) {
            const content = extractTextContent(parsed.message?.content);
            if (!isValidUserMessage(content)) {
              continue;
            }
          }

          if (currentType !== prevType) {
            if (ClaudeHelper.isUserMessage(currentType)) {
              userCount++;
            } else {
              assistantCount++;
            }
            prevType = currentType;
          }
        }
      } catch {}
    }

    return { userCount, assistantCount, totalCount: userCount + assistantCount };
  } else {
    const userCount = lines.filter((line) => {
      try {
        const parsed = JSON.parse(line);
        if (!ClaudeHelper.isUserMessage(parsed.type)) {
          return false;
        }
        const content = extractTextContent(parsed.message?.content);
        return isValidUserMessage(content);
      } catch {
        return false;
      }
    }).length;

    const assistantCount = lines.filter((line) => {
      try {
        const parsed = JSON.parse(line);
        return ClaudeHelper.isCCMessage(parsed.type);
      } catch {
        return false;
      }
    }).length;

    return { userCount, assistantCount, totalCount: userCount + assistantCount };
  }
}

function calculateTokenPercentage(lines: string[]): number | undefined {
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
          return Math.floor((total * 100) / TOKEN_LIMIT);
        }
      }
    } catch {}
  }
  return undefined;
}

function extractSummary(lines: string[]): string | undefined {
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'summary' && parsed.summary) {
        return parsed.summary;
      }
    } catch {}
  }
  return undefined;
}

function extractTitle(lines: string[], titleSource: TitleSource): string {
  if (titleSource === TitleSource.LAST_CC_MESSAGE) {
    for (let j = lines.length - 1; j >= 0; j--) {
      try {
        const parsed = JSON.parse(lines[j]);
        if (ClaudeHelper.isCCMessage(parsed.type) && Array.isArray(parsed.message?.content)) {
          for (const item of parsed.message.content) {
            if (item.type === 'text' && item.text) {
              let title = item.text.replace(/\n/g, ' ').trim();
              if (title.length > MAX_TITLE_LENGTH) {
                title = `${title.substring(0, MAX_TITLE_LENGTH)}...`;
              }
              return title;
            }
          }
        }
      } catch {}
    }
    return 'Empty session';
  }

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (ClaudeHelper.isUserMessage(parsed.type)) {
        const content = extractTextContent(parsed.message?.content);
        if (content && content !== 'Warmup') {
          const firstLine = content.split('\n')[0].replace(/\\/g, '').replace(/\s+/g, ' ').trim();

          if (firstLine.includes('Caveat:')) {
            continue;
          }

          const parsedCommand = parseCommandFromContent(content);

          if (parsedCommand) {
            const commandMatch = content.match(/<command-name>\/?([^<]+)<\/command-name>/);
            const commandName = commandMatch?.[1];
            if (commandName && CLAUDE_CODE_COMMANDS.includes(commandName)) {
              continue;
            }
          }

          const isSystemMessage =
            firstLine.startsWith('<local-command-') ||
            firstLine.startsWith('[Tool:') ||
            firstLine.startsWith('[Request interrupted');

          if (isSystemMessage) {
            continue;
          }

          let title = parsedCommand || content.replace(/\\/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

          if (title.length > MAX_TITLE_LENGTH) {
            title = `${title.substring(0, MAX_TITLE_LENGTH)}...`;
          }
          return title;
        }
      }
    } catch {}
  }

  return '';
}

function countImages(lines: string[]): number {
  let count = 0;
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      const messageContent = parsed.message?.content;

      if (Array.isArray(messageContent)) {
        for (const item of messageContent) {
          if (item.type === 'image') {
            count++;
          }
        }
      }
    } catch {}
  }
  return count;
}

function countCustomCommands(lines: string[]): number {
  let count = 0;
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (ClaudeHelper.isUserMessage(parsed.type)) {
        const content = extractTextContent(parsed.message?.content);
        if (content) {
          const commandMatch = content.match(/<command-name>\/?([^<]+)<\/command-name>/);
          if (commandMatch) {
            const commandName = commandMatch[1];
            if (!CLAUDE_CODE_COMMANDS.includes(commandName)) {
              count++;
            }
          }
        }
      }
    } catch {}
  }
  return count;
}

function countFilesOrFolders(lines: string[]): number {
  let count = 0;
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (ClaudeHelper.isUserMessage(parsed.type)) {
        const content = extractTextContent(parsed.message?.content);
        if (content) {
          const fileOrFolderMatches = content.match(/@[\w\-./]+/g);
          if (fileOrFolderMatches) {
            count += fileOrFolderMatches.length;
          }
        }
      }
    } catch {}
  }
  return count;
}

function countUrls(lines: string[]): number {
  let count = 0;
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\]]+/g;
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (ClaudeHelper.isUserMessage(parsed.type)) {
        const content = extractTextContent(parsed.message?.content);
        if (content) {
          const urlMatches = content.match(urlRegex);
          if (urlMatches) {
            count += urlMatches.length;
          }
        }
      }
    } catch {}
  }
  return count;
}

async function readLabels(sessionsPath: string, sessionId: string): Promise<string[] | undefined> {
  const metadataPath = join(sessionsPath, '.metadata', `${sessionId}.json`);
  try {
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    return metadata.labels?.length > 0 ? metadata.labels : undefined;
  } catch {
    return undefined;
  }
}

async function processSessionFile(
  filePath: string,
  file: string,
  sessionsPath: string,
  options: {
    search: string;
    messageCountMode: MessageCountMode;
    titleSource: TitleSource;
    includeImages: boolean;
    includeCustomCommands: boolean;
    includeFilesOrFolders: boolean;
    includeUrls: boolean;
    includeLabels: boolean;
  }
): Promise<SessionListItem | null> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  if (ClaudeHelper.isCompactionSession(lines)) return null;

  const firstUserMessage = extractTextContent(
    lines
      .map((line) => {
        try {
          const parsed = JSON.parse(line);
          if (ClaudeHelper.isUserMessage(parsed.type)) {
            return parsed.message?.content;
          }
        } catch {}
        return null;
      })
      .find((msg) => msg)
  );

  if (firstUserMessage.startsWith(CLAUDE_CODE_SESSION_COMPACTION_ID)) {
    return null;
  }

  const title = extractTitle(lines, options.titleSource);

  if (!title && IGNORE_EMPTY_SESSIONS) {
    return null;
  }

  let searchMatchCount: number | undefined;
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    const titleMatch = title.toLowerCase().includes(searchLower);

    let contentMatches = 0;
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (ClaudeHelper.isUserMessage(parsed.type) || ClaudeHelper.isCCMessage(parsed.type)) {
          const messageContent = extractTextContent(parsed.message?.content);
          if (messageContent) {
            const matches = messageContent.toLowerCase().split(searchLower).length - 1;
            contentMatches += matches;
          }
        }
      } catch {}
    }

    if (!titleMatch && contentMatches === 0) {
      return null;
    }

    searchMatchCount = contentMatches + (titleMatch ? 1 : 0);
  }

  const tokenPercentage = calculateTokenPercentage(lines);
  const messageCounts = countMessages(lines, options.messageCountMode);
  const stats = await stat(filePath);
  const sessionId = file.replace('.jsonl', '');

  const summary = extractSummary(lines);

  const session: SessionListItem = {
    id: sessionId,
    title: title || 'Empty session',
    messageCount: messageCounts.totalCount,
    createdAt: stats.birthtimeMs,
    tokenPercentage,
    searchMatchCount,
    filePath,
    shortId: sessionId.slice(-12),
    userMessageCount: messageCounts.userCount,
    assistantMessageCount: messageCounts.assistantCount,
    summary
  };

  if (options.includeImages) {
    const imageCount = countImages(lines);
    if (imageCount > 0) session.imageCount = imageCount;
  }

  if (options.includeCustomCommands) {
    const customCommandCount = countCustomCommands(lines);
    if (customCommandCount > 0) session.customCommandCount = customCommandCount;
  }

  if (options.includeFilesOrFolders) {
    const filesOrFoldersCount = countFilesOrFolders(lines);
    if (filesOrFoldersCount > 0) session.filesOrFoldersCount = filesOrFoldersCount;
  }

  if (options.includeUrls) {
    const urlCount = countUrls(lines);
    if (urlCount > 0) session.urlCount = urlCount;
  }

  if (options.includeLabels) {
    const labels = await readLabels(sessionsPath, sessionId);
    if (labels) session.labels = labels;
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
  const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

  const processOptions = {
    search,
    messageCountMode,
    titleSource,
    includeImages,
    includeCustomCommands,
    includeFilesOrFolders,
    includeUrls,
    includeLabels
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
        processSessionFile(filePath, file, sessionsPath, processOptions)
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

    const filesToProcess = fileStats.slice(0, limit);
    const sessionPromises = filesToProcess.map(({ file, filePath }) =>
      processSessionFile(filePath, file, sessionsPath, processOptions)
    );

    const sessionsResults = await Promise.all(sessionPromises);
    sessions = sessionsResults.filter((s) => s !== null) as SessionListItem[];

    return { items: sessions };
  }

  const sessionPromises = sessionFiles.map((file) => {
    const filePath = join(sessionsPath, file);
    return processSessionFile(filePath, file, sessionsPath, processOptions);
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
