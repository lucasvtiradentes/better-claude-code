import type { Message, Session } from '@bcc/shared';
import { Router, type Router as RouterType } from 'express';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { isCompactionSession } from '../utils/session-filter.js';

export const sessionsRouter: RouterType = Router();

sessionsRouter.get('/:repoName', async (req, res) => {
  try {
    const { repoName } = req.params;
    const sessionsPath = path.join(os.homedir(), '.claude', 'projects', repoName, 'sessions');
    const files = await fs.readdir(sessionsPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl'));

    const sessions: Session[] = [];

    for (const file of sessionFiles) {
      const filePath = path.join(sessionsPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      if (isCompactionSession(lines)) continue;

      const events = lines.map((line) => JSON.parse(line));
      const messages = events.filter((e: any) => e.type === 'user' || e.type === 'assistant');

      let tokenUsage: { used: number; total: number; percentage: number } | undefined;
      const lastMessage = events[events.length - 1];
      if (lastMessage?.usage) {
        const used = lastMessage.usage.input_tokens + lastMessage.usage.output_tokens;
        const total = lastMessage.usage.cache_read_input_tokens + used;
        tokenUsage = {
          used,
          total,
          percentage: total > 0 ? Math.round((used / total) * 100) : 0
        };
      }

      const userMessages = messages.filter((m: any) => m.type === 'user');
      const firstUserMessage = userMessages[0];
      let title = 'Untitled Session';

      if (firstUserMessage?.content) {
        const text =
          typeof firstUserMessage.content === 'string'
            ? firstUserMessage.content
            : firstUserMessage.content.find((c: any) => c.type === 'text')?.text || '';
        title = text.slice(0, 50) + (text.length > 50 ? '...' : '');
      }

      const stats = await fs.stat(filePath);

      sessions.push({
        id: file.replace('.jsonl', ''),
        title,
        messageCount: messages.length,
        createdAt: stats.birthtimeMs,
        tokenUsage
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
    const filePath = path.join(os.homedir(), '.claude', 'projects', repoName, 'sessions', `${sessionId}.jsonl`);

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines.map((line) => JSON.parse(line));

    const messages: Message[] = events
      .filter((e: any) => e.type === 'user' || e.type === 'assistant')
      .filter((e: any) => {
        if (typeof e.content === 'string') {
          return e.content !== 'Warmup';
        }
        return true;
      });

    res.json({ messages });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read session' });
  }
});

sessionsRouter.get('/:repoName/:sessionId/images', async (req, res) => {
  try {
    const { repoName, sessionId } = req.params;
    const filePath = path.join(os.homedir(), '.claude', 'projects', repoName, 'sessions', `${sessionId}.jsonl`);

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
