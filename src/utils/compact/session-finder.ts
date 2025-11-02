import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { ConfigManager } from '../../config/config-manager.js';
import { MessageCountMode, TitleMessage } from '../../config/types.js';
import { getGitRepoRoot } from '../git.js';

const MAX_TITLE_LENGTH = 80;

export interface SessionInfo {
  id: string;
  file: string;
  timestamp: number;
  userCount: number;
  assistantCount: number;
  title: string;
  shortId: string;
  tokenPercentage?: number;
}

function getCurrentDirectory(): string {
  return process.cwd();
}

function normalizePathForClaudeProjects(dirPath: string): string {
  return dirPath.replace(/\/_/g, '--').replace(/\//g, '-').replace(/_/g, '-');
}

export async function getProjectDir(): Promise<string> {
  const claudeDir = join(homedir(), '.claude');

  let currentDir: string;
  try {
    currentDir = await getGitRepoRoot();
  } catch {
    currentDir = getCurrentDirectory();
  }

  const normalized = normalizePathForClaudeProjects(currentDir);
  const projectDir = join(claudeDir, 'projects', normalized);
  return projectDir;
}

function countMessages(lines: string[], mode: MessageCountMode): { userCount: number; assistantCount: number } {
  if (mode === MessageCountMode.TURN) {
    let userCount = 0;
    let assistantCount = 0;
    let prevType = '';

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const currentType = parsed.type;

        if ((currentType === 'user' || currentType === 'assistant') && currentType !== prevType) {
          if (currentType === 'user') {
            userCount++;
          } else {
            assistantCount++;
          }
          prevType = currentType;
        }
      } catch {}
    }

    return { userCount, assistantCount };
  } else {
    const userCount = lines.filter((line) => {
      try {
        const parsed = JSON.parse(line);
        return parsed.type === 'user';
      } catch {
        return false;
      }
    }).length;

    const assistantCount = lines.filter((line) => {
      try {
        const parsed = JSON.parse(line);
        return parsed.type === 'assistant';
      } catch {
        return false;
      }
    }).length;

    return { userCount, assistantCount };
  }
}

export async function findSessions(limit?: number, useLastMessage?: boolean): Promise<SessionInfo[]> {
  const projectDir = await getProjectDir();

  if (!existsSync(projectDir)) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  const configManager = new ConfigManager();
  const countMode = configManager.getMessageCountMode();
  const titleMode = useLastMessage ? TitleMessage.LAST_CC_MESSAGE : TitleMessage.FIRST_USER_MESSAGE;

  const files = readdirSync(projectDir)
    .filter((file) => file.endsWith('.jsonl') && !file.startsWith('agent-'))
    .map((file) => ({
      file: join(projectDir, file),
      id: file.replace('.jsonl', ''),
      mtime: statSync(join(projectDir, file)).mtimeMs
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const sessions: SessionInfo[] = [];
  const limitToUse = limit || 20;

  for (let i = 0; i < Math.min(files.length, limitToUse); i++) {
    const { file, id, mtime } = files[i];
    const content = readFileSync(file, 'utf-8');
    const lines = content.trim().split('\n');

    const { userCount, assistantCount } = countMessages(lines, countMode);

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

    let firstUserMessage = '';
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'user' && typeof parsed.message?.content === 'string') {
          const content = parsed.message.content;
          if (content && content !== 'Warmup' && !content.includes('Caveat:')) {
            firstUserMessage = content;
            break;
          }
        }
      } catch {}
    }

    if (firstUserMessage.startsWith('CLAUDE_CODE_SESSION_COMPACTION_ID')) {
      continue;
    }

    let title = '';
    if (titleMode === TitleMessage.LAST_CC_MESSAGE) {
      for (let j = lines.length - 1; j >= 0; j--) {
        try {
          const parsed = JSON.parse(lines[j]);
          if (parsed.type === 'assistant' && Array.isArray(parsed.message?.content)) {
            for (const item of parsed.message.content) {
              if (item.type === 'text' && item.text) {
                title = item.text.replace(/\n/g, ' ').trim().substring(0, MAX_TITLE_LENGTH);
                if (title.length === MAX_TITLE_LENGTH) title += '...';
                break;
              }
            }
            if (title) break;
          }
        } catch {}
      }
    } else {
      title = firstUserMessage.replace(/\n/g, ' ').trim().substring(0, MAX_TITLE_LENGTH);
      if (title.length === MAX_TITLE_LENGTH) title += '...';
    }

    sessions.push({
      id,
      file,
      timestamp: mtime,
      userCount,
      assistantCount,
      title: title || 'Empty session',
      shortId: id.slice(-12),
      tokenPercentage
    });
  }

  return sessions;
}

export async function findSessionById(sessionId: string): Promise<SessionInfo | null> {
  const projectDir = await getProjectDir();
  const fullId = sessionId.length < 36 ? findFullSessionId(projectDir, sessionId) : sessionId;

  if (!fullId) {
    return null;
  }

  const sessionFile = join(projectDir, `${fullId}.jsonl`);

  if (!existsSync(sessionFile)) {
    return null;
  }

  const configManager = new ConfigManager();
  const countMode = configManager.getMessageCountMode();

  const content = readFileSync(sessionFile, 'utf-8');
  const lines = content.trim().split('\n');

  const { userCount, assistantCount } = countMessages(lines, countMode);

  return {
    id: fullId,
    file: sessionFile,
    timestamp: statSync(sessionFile).mtimeMs,
    userCount,
    assistantCount,
    title: '',
    shortId: fullId.slice(-12)
  };
}

function findFullSessionId(projectDir: string, partialId: string): string | null {
  const files = readdirSync(projectDir).filter(
    (file) => file.endsWith('.jsonl') && !file.startsWith('agent-') && file.includes(partialId)
  );

  return files.length > 0 ? files[0].replace('.jsonl', '') : null;
}
