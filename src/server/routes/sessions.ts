import { Router as createRouter, type Router } from 'express';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export const sessionsRouter: Router = createRouter();

interface SessionListItem {
  id: string;
  shortId: string;
  title: string;
  userCount: number;
  assistantCount: number;
  timestamp: number;
  tokenPercentage?: number;
}

interface MessageItem {
  type: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

function getClaudeProjectsDir(): string {
  return join(homedir(), '.claude', 'projects');
}

function countMessages(lines: string[]): { userCount: number; assistantCount: number } {
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
}

function extractTextContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const item of content) {
      if (item.type === 'text' && item.text) {
        textParts.push(item.text);
      } else if (item.type === 'tool_use') {
        const toolName = item.name;
        const input = item.input || {};
        let toolInfo = `[Tool: ${toolName}]`;

        if (toolName === 'Edit' || toolName === 'Read' || toolName === 'Write') {
          if (input.file_path) {
            toolInfo = `[Tool: ${toolName}] ${input.file_path}`;
          }
        } else if (toolName === 'Glob') {
          const parts = [];
          if (input.pattern) parts.push(`pattern: "${input.pattern}"`);
          if (input.path) parts.push(`path: ${input.path}`);
          if (parts.length > 0) {
            toolInfo = `[Tool: ${toolName}] ${parts.join(', ')}`;
          }
        } else if (toolName === 'Grep') {
          const parts = [];
          if (input.pattern) parts.push(`pattern: "${input.pattern}"`);
          if (input.path) parts.push(`path: ${input.path}`);
          if (parts.length > 0) {
            toolInfo = `[Tool: ${toolName}] ${parts.join(', ')}`;
          }
        } else if (toolName === 'Task') {
          if (input.description) {
            toolInfo = `[Tool: ${toolName}] ${input.description}`;
          }
        } else if (toolName === 'WebSearch') {
          if (input.query) {
            toolInfo = `[Tool: ${toolName}] "${input.query}"`;
          }
        } else if (toolName === 'Bash') {
          if (input.description) {
            toolInfo = `[Tool: ${toolName}] ${input.description}`;
          }
        }

        textParts.push(toolInfo);
      }
    }
    return textParts.join('\n');
  }

  return '';
}

sessionsRouter.get('/:repoName', (req, res) => {
  const { repoName } = req.params;
  const repoPath = join(getClaudeProjectsDir(), repoName);

  if (!existsSync(repoPath)) {
    return res.status(404).json({ error: 'Repository not found' });
  }

  const files = readdirSync(repoPath)
    .filter((file) => file.endsWith('.jsonl') && !file.startsWith('agent-'))
    .map((file) => ({
      file: join(repoPath, file),
      id: file.replace('.jsonl', ''),
      mtime: statSync(join(repoPath, file)).mtimeMs
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const sessions: SessionListItem[] = [];

  for (const { file, id, mtime } of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.trim().split('\n');

    const { userCount, assistantCount } = countMessages(lines);

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
        if (parsed.type === 'user' && typeof parsed.message?.content === 'string') {
          const content = parsed.message.content;
          if (content && content !== 'Warmup' && !content.includes('Caveat:')) {
            title = content.replace(/\n/g, ' ').trim().substring(0, 80);
            if (title.length === 80) title += '...';
            break;
          }
        }
      } catch {}
    }

    if (title.startsWith('CLAUDE_CODE_SESSION_COMPACTION_ID')) {
      continue;
    }

    sessions.push({
      id,
      shortId: id.slice(-12),
      title: title || 'Empty session',
      userCount,
      assistantCount,
      timestamp: mtime,
      tokenPercentage
    });
  }

  res.json({ sessions });
});

sessionsRouter.get('/:repoName/:sessionId', (req, res) => {
  const { repoName, sessionId } = req.params;
  const sessionFile = join(getClaudeProjectsDir(), repoName, `${sessionId}.jsonl`);

  if (!existsSync(sessionFile)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const content = readFileSync(sessionFile, 'utf-8');
  const lines = content.trim().split('\n');

  const messages: MessageItem[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);

      if (parsed.type === 'user') {
        const textContent = extractTextContent(parsed.message?.content);
        if (textContent) {
          messages.push({
            type: 'user',
            content: textContent,
            timestamp: parsed.timestamp
          });
        }
      } else if (parsed.type === 'assistant') {
        const textContent = extractTextContent(parsed.message?.content);
        if (textContent) {
          messages.push({
            type: 'assistant',
            content: textContent,
            timestamp: parsed.timestamp
          });
        }
      }
    } catch {}
  }

  res.json({ messages });
});
