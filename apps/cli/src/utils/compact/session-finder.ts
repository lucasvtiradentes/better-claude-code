import { join } from 'node:path';
import { ClaudeHelper, listSessions, MessageCountMode, TitleSource } from '@better-claude-code/node-utils';
import { ConfigManager } from '../../config/config-manager.js';
import { TitleMessage } from '../../config/types.js';
import { getGitRepoRoot } from '../git.js';

export interface SessionInfo {
  id: string;
  file: string;
  timestamp: number;
  userCount: number;
  assistantCount: number;
  title: string;
  shortId: string;
  tokenPercentage?: number;
  imageCount?: number;
  filesOrFoldersCount?: number;
}

function getCurrentDirectory() {
  return process.cwd();
}

export async function getProjectDir() {
  let currentDir: string;
  try {
    currentDir = await getGitRepoRoot();
  } catch {
    currentDir = getCurrentDirectory();
  }

  const normalized = ClaudeHelper.normalizePathForClaudeProjects(currentDir);
  const projectDir = join(ClaudeHelper.getProjectsDir(), normalized);
  return projectDir;
}

export async function findSessions(limit?: number, useLastMessage?: boolean): Promise<SessionInfo[]> {
  let currentDir: string;
  try {
    currentDir = await getGitRepoRoot();
  } catch {
    currentDir = getCurrentDirectory();
  }

  const configManager = new ConfigManager();
  const countMode =
    configManager.getMessageCountMode() === 'turn' ? MessageCountMode.TURN : MessageCountMode.EVENT;
  const titleSource = useLastMessage ? TitleSource.LAST_CC_MESSAGE : TitleSource.FIRST_USER_MESSAGE;

  const result = await listSessions({
    projectPath: currentDir,
    limit: limit || 20,
    messageCountMode: countMode,
    titleSource,
    includeImages: true,
    includeFilesOrFolders: true
  });

  return result.items.map((item) => ({
    id: item.id,
    file: item.filePath!,
    timestamp: item.createdAt,
    userCount: item.userMessageCount!,
    assistantCount: item.assistantMessageCount!,
    title: item.title,
    shortId: item.shortId!,
    tokenPercentage: item.tokenPercentage,
    imageCount: item.imageCount,
    filesOrFoldersCount: item.filesOrFoldersCount
  }));
}

export async function findSessionById(sessionId: string, limit = 1000): Promise<SessionInfo | null> {
  let currentDir: string;
  try {
    currentDir = await getGitRepoRoot();
  } catch {
    currentDir = getCurrentDirectory();
  }

  const configManager = new ConfigManager();
  const countMode =
    configManager.getMessageCountMode() === 'turn' ? MessageCountMode.TURN : MessageCountMode.EVENT;

  const result = await listSessions({
    projectPath: currentDir,
    limit,
    messageCountMode: countMode
  });

  const fullId = sessionId.length < 36 ? result.items.find((s) => s.id.includes(sessionId))?.id : sessionId;

  if (!fullId) {
    return null;
  }

  const session = result.items.find((s) => s.id === fullId);

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    file: session.filePath!,
    timestamp: session.createdAt,
    userCount: session.userMessageCount!,
    assistantCount: session.assistantMessageCount!,
    title: session.title,
    shortId: session.shortId!,
    tokenPercentage: session.tokenPercentage
  };
}
