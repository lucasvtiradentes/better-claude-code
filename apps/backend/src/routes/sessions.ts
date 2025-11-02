import type { Message, Session } from '@bcc/shared';
import { Router, type Router as RouterType } from 'express';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { isCompactionSession } from '../utils/session-filter.js';

export const sessionsRouter: RouterType = Router();

async function getRealPathFromSession(folderPath: string): Promise<string | null> {
  try {
    const files = await fs.readdir(folderPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    if (sessionFiles.length === 0) return null;

    const firstSession = path.join(folderPath, sessionFiles[0]);
    const content = await fs.readFile(firstSession, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);
        if (parsed.cwd) {
          return parsed.cwd;
        }
      } catch {}
    }

    return null;
  } catch {
    return null;
  }
}

function parseCommandFromContent(content: string): string | null {
  const commandNameMatch = content.match(/<command-name>\/?([^<]+)<\/command-name>/);
  const commandArgsMatch = content.match(/<command-args>([^<]+)<\/command-args>/);

  if (commandNameMatch) {
    const cmdName = commandNameMatch[1];
    const cmdArgs = commandArgsMatch ? commandArgsMatch[1] : '';
    return cmdArgs ? `/${cmdName} ${cmdArgs}` : `/${cmdName}`;
  }

  return null;
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

sessionsRouter.get('/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const page = Number.parseInt(req.query.page as string, 10) || 1;
    const limit = Number.parseInt(req.query.limit as string, 10) || 20;

    const sessionsPath = path.join(os.homedir(), '.claude', 'projects', projectName);
    const files = await fs.readdir(sessionsPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    const sessions: Session[] = [];

    for (const file of sessionFiles) {
      const filePath = path.join(sessionsPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      if (isCompactionSession(lines)) continue;

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

      const stats = await fs.stat(filePath);

      sessions.push({
        id: file.replace('.jsonl', ''),
        title,
        messageCount: messages.length,
        createdAt: stats.birthtimeMs,
        tokenPercentage
      });
    }

    sessions.sort((a, b) => b.createdAt - a.createdAt);

    const totalItems = sessions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSessions = sessions.slice(startIndex, endIndex);

    res.json({
      items: paginatedSessions,
      meta: {
        totalItems,
        totalPages,
        page,
        limit
      }
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read sessions' });
  }
});

sessionsRouter.get('/:projectName/:sessionId', async (req, res) => {
  try {
    const { projectName, sessionId } = req.params;
    const filePath = path.join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines.map((line) => JSON.parse(line));

    const messages: Array<{ type: 'user' | 'assistant'; content: string; timestamp?: number }> = [];

    for (const event of events) {
      if (event.type === 'user' || event.type === 'assistant') {
        const textContent = extractTextContent(event.message?.content || event.content);
        if (textContent && textContent !== 'Warmup') {
          messages.push({
            type: event.type,
            content: textContent,
            timestamp: event.timestamp
          });
        }
      }
    }

    const groupedMessages: Message[] = [];
    for (const msg of messages) {
      const lastMsg = groupedMessages[groupedMessages.length - 1];
      if (lastMsg && lastMsg.type === msg.type) {
        if (typeof lastMsg.content === 'string' && typeof msg.content === 'string') {
          lastMsg.content = `${lastMsg.content}\n---\n${msg.content}`;
        }
      } else {
        groupedMessages.push({ ...msg } as Message);
      }
    }

    const filteredMessages = groupedMessages.filter((msg) => {
      if (typeof msg.content === 'string') {
        return msg.content.trim().length > 0;
      }
      return true;
    });

    res.json({ messages: filteredMessages });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read session' });
  }
});

sessionsRouter.get('/:projectName/:sessionId/images', async (req, res) => {
  try {
    const { projectName, sessionId } = req.params;
    const filePath = path.join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    const images: Array<{ index: number; data: string }> = [];
    let imageIndex = 1;

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const messageContent = parsed.message?.content;

        if (Array.isArray(messageContent)) {
          for (const item of messageContent) {
            if (item.type === 'image' && item.source?.type === 'base64') {
              images.push({
                index: imageIndex++,
                data: item.source.data
              });
            }
          }
        }
      } catch {}
    }

    res.json(images);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to extract images' });
  }
});

sessionsRouter.get('/:projectName/:sessionId/file', async (req, res) => {
  try {
    const { projectName } = req.params;
    const filePath = req.query.path as string;

    if (!filePath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    const projectPath = path.join(os.homedir(), '.claude', 'projects', projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    if (!realProjectPath) {
      return res.status(404).json({ error: 'Project path not found' });
    }

    const fullPath = path.resolve(realProjectPath, filePath.startsWith('/') ? filePath.slice(1) : filePath);

    if (!fullPath.startsWith(realProjectPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ content });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

sessionsRouter.get('/:projectName/:sessionId/folder', async (req, res) => {
  try {
    const { projectName } = req.params;
    const folderPath = req.query.path as string;

    if (!folderPath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    const projectPath = path.join(os.homedir(), '.claude', 'projects', projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    if (!realProjectPath) {
      return res.status(404).json({ error: 'Project path not found' });
    }

    const fullPath = path.resolve(realProjectPath, folderPath.startsWith('/') ? folderPath.slice(1) : folderPath);

    if (!fullPath.startsWith(realProjectPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const dirEntries = await fs.readdir(fullPath, { withFileTypes: true });
    const entries = dirEntries
      .filter((entry) => !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        path: path.join(folderPath, entry.name),
        type: entry.isDirectory() ? 'directory' : 'file'
      }))
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });

    res.json({ entries });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read folder' });
  }
});
