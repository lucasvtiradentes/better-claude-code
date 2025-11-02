import type { Message, Session } from '@bcc/shared';
import { Router, type Router as RouterType } from 'express';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { isCompactionSession } from '../utils/session-filter.js';

export const sessionsRouter: RouterType = Router();

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
      }
    }
    return textParts.join('\n');
  }

  return '';
}

sessionsRouter.get('/:repoName', async (req, res) => {
  try {
    const { repoName } = req.params;
    const sessionsPath = path.join(os.homedir(), '.claude', 'projects', repoName);
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

    res.json(sessions);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read sessions' });
  }
});

sessionsRouter.get('/:repoName/:sessionId', async (req, res) => {
  try {
    const { repoName, sessionId } = req.params;
    const filePath = path.join(os.homedir(), '.claude', 'projects', repoName, `${sessionId}.jsonl`);

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines.map((line) => JSON.parse(line));

    const messages: Message[] = events
      .filter((e: any) => e.type === 'user' || e.type === 'assistant')
      .filter((e: any) => {
        const messageContent = e.message?.content || e.content;
        if (typeof messageContent === 'string') {
          return messageContent !== 'Warmup';
        }
        return true;
      })
      .map((e: any) => ({
        type: e.type,
        content: e.message?.content || e.content,
        timestamp: e.timestamp,
        model: e.message?.model,
        stop_reason: e.message?.stop_reason
      }));

    res.json({ messages });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read session' });
  }
});

sessionsRouter.get('/:repoName/:sessionId/images', async (req, res) => {
  try {
    const { repoName, sessionId } = req.params;
    const filePath = path.join(os.homedir(), '.claude', 'projects', repoName, `${sessionId}.jsonl`);

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines.map((line) => JSON.parse(line));

    const images: Array<{ index: number; data: string }> = [];
    let imageIndex = 1;

    for (const event of events) {
      if (event.type === 'user' && Array.isArray(event.content)) {
        for (const part of event.content) {
          if (part.type === 'image' && part.source?.data) {
            images.push({
              index: imageIndex++,
              data: part.source.data
            });
          }
        }
      }
    }

    res.json(images);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to extract images' });
  }
});
