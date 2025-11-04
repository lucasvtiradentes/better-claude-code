// @ts-nocheck
import { dirname, join, resolve } from 'node:path';
import type { Message } from '@better-claude-code/shared';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import os from 'os';
import { z } from 'zod';
import {
  ErrorSchema,
  FolderContentSchema,
  FolderEntriesSchema,
  ImageSchema,
  LabelsResponseSchema,
  MessageSchema,
  PathValidationSchema,
  SessionDetailResponseSchema,
  SessionsResponseSchema,
  SuccessSchema
} from '../schemas.js';
import { isCompactionSession } from '../utils/session-filter.js';

export const sessionsRouter = new OpenAPIHono();

const MESSAGE_PATTERNS = {
  FILE_OR_FOLDER_SLASH: /\/([\w\-./]+)/g,
  FILE_OR_FOLDER_AT: /(^|\s)@([a-zA-Z][\w\-.]*(?:\/[\w\-./]+)*)/g
} as const;

function extractPathsFromText(text: string): string[] {
  const paths = new Set<string>();

  const slashMatches = text.match(MESSAGE_PATTERNS.FILE_OR_FOLDER_SLASH);
  if (slashMatches) {
    for (const match of slashMatches) {
      paths.add(match);
    }
  }

  const atRegex = new RegExp(MESSAGE_PATTERNS.FILE_OR_FOLDER_AT.source, 'g');
  const atMatches = text.matchAll(atRegex);
  for (const match of atMatches) {
    const cleanMatch = match[0].trim().substring(1);
    paths.add(cleanMatch);
  }

  return Array.from(paths);
}

async function getRealPathFromSession(folderPath: string): Promise<string | null> {
  try {
    const files = await fs.readdir(folderPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    if (sessionFiles.length === 0) return null;

    const firstSession = join(folderPath, sessionFiles[0]);
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

const getSessionsRoute = createRoute({
  method: 'get',
  path: '/{projectName}',
  tags: ['Sessions'],
  request: {
    params: z.object({
      projectName: z.string()
    }),
    query: z.object({
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(20),
      search: z.string().optional().default(''),
      sortBy: z.string().optional().default('date')
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SessionsResponseSchema
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
  }
});

sessionsRouter.openapi(getSessionsRoute, async (c) => {
  try {
    const { projectName } = c.req.param();
    const { page, limit, search, sortBy } = c.req.query();

    const sessionsPath = join(os.homedir(), '.claude', 'projects', projectName);
    const files = await fs.readdir(sessionsPath);
    const sessionFiles = files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    const sessions: any[] = [];

    for (const file of sessionFiles) {
      const filePath = join(sessionsPath, file);
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

      let searchMatchCount: number | undefined;

      if (search) {
        const searchLower = search.toLowerCase();
        const titleMatch = title.toLowerCase().includes(searchLower);
        const contentLower = content.toLowerCase();
        const contentMatches = contentLower.split(searchLower).length - 1;

        if (!titleMatch && contentMatches === 0) {
          continue;
        }

        searchMatchCount = contentMatches + (titleMatch ? 1 : 0);
      }

      const stats = await fs.stat(filePath);

      let imageCount = 0;
      let customCommandCount = 0;
      let filesOrFoldersCount = 0;

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const messageContent = parsed.message?.content;

          if (Array.isArray(messageContent)) {
            for (const item of messageContent) {
              if (item.type === 'image') {
                imageCount++;
              }
            }
          }

          if (parsed.type === 'user') {
            const content = extractTextContent(parsed.message?.content);
            if (content) {
              const commandMatch = content.match(/<command-name>\/?([^<]+)<\/command-name>/);
              if (commandMatch) {
                customCommandCount++;
              }

              const fileOrFolderMatches = content.match(/\/([\w\-./]+)/g);
              if (fileOrFolderMatches) {
                filesOrFoldersCount += fileOrFolderMatches.length;
              }
            }
          }
        } catch {}
      }

      const sessionId = file.replace('.jsonl', '');
      const metadataPath = join(sessionsPath, '.metadata', `${sessionId}.json`);

      let labels: string[] | undefined;
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataContent);
        labels = metadata.labels?.length > 0 ? metadata.labels : undefined;
      } catch {}

      sessions.push({
        id: sessionId,
        title,
        messageCount: messages.length,
        createdAt: stats.birthtimeMs,
        tokenPercentage,
        searchMatchCount,
        imageCount: imageCount > 0 ? imageCount : undefined,
        customCommandCount: customCommandCount > 0 ? customCommandCount : undefined,
        filesOrFoldersCount: filesOrFoldersCount > 0 ? filesOrFoldersCount : undefined,
        labels
      });
    }

    if (sortBy === 'token-percentage') {
      sessions.sort((a, b) => {
        const aToken = a.tokenPercentage ?? -1;
        const bToken = b.tokenPercentage ?? -1;
        return bToken - aToken;
      });
    } else {
      sessions.sort((a, b) => b.createdAt - a.createdAt);
    }

    const totalItems = sessions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSessions = sessions.slice(startIndex, endIndex);

    return c.json({
      items: paginatedSessions,
      meta: {
        totalItems,
        totalPages,
        page,
        limit
      }
    });
  } catch {
    return c.json({ error: 'Failed to read sessions' }, 500);
  }
});

const getSessionDetailRoute = createRoute({
  method: 'get',
  path: '/{projectName}/{sessionId}',
  tags: ['Sessions'],
  request: {
    params: z.object({
      projectName: z.string(),
      sessionId: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SessionDetailResponseSchema
        }
      },
      description: 'Returns session details with messages and images'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to read session'
    }
  }
});

sessionsRouter.openapi(getSessionDetailRoute, async (c) => {
  try {
    const { projectName, sessionId } = c.req.param();
    const filePath = join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);

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

    const images: Array<{ index: number; data: string }> = [];
    try {
      for (const event of events) {
        if (event.type === 'user' && Array.isArray(event.message?.content)) {
          for (const item of event.message.content) {
            if (item.type === 'image') {
              const imageData = item.source?.type === 'base64' ? item.source.data : null;
              if (imageData) {
                images.push({ index: images.length + 1, data: imageData });
              }
            }
          }
        }
      }
    } catch {}

    return c.json({ messages: filteredMessages, images });
  } catch {
    return c.json({ error: 'Failed to read session' }, 500);
  }
});

const getSessionImagesRoute = createRoute({
  method: 'get',
  path: '/{projectName}/{sessionId}/images',
  tags: ['Sessions'],
  request: {
    params: z.object({
      projectName: z.string(),
      sessionId: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(ImageSchema)
        }
      },
      description: 'Returns session images'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to extract images'
    }
  }
});

sessionsRouter.openapi(getSessionImagesRoute, async (c) => {
  try {
    const { projectName, sessionId } = c.req.param();
    const filePath = join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);

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

    return c.json(images);
  } catch {
    return c.json({ error: 'Failed to extract images' }, 500);
  }
});

const getSessionFileRoute = createRoute({
  method: 'get',
  path: '/{projectName}/{sessionId}/file',
  tags: ['Sessions'],
  request: {
    params: z.object({
      projectName: z.string(),
      sessionId: z.string()
    }),
    query: z.object({
      path: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: FolderContentSchema
        }
      },
      description: 'Returns file content'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Path parameter is required'
    },
    403: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Access denied'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Project path not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to read file'
    }
  }
});

sessionsRouter.openapi(getSessionFileRoute, async (c) => {
  try {
    const { projectName } = c.req.param();
    const { path: filePath } = c.req.query();

    if (!filePath) {
      return c.json({ error: 'Path parameter is required' }, 400);
    }

    const projectPath = join(os.homedir(), '.claude', 'projects', projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    if (!realProjectPath) {
      return c.json({ error: 'Project path not found' }, 404);
    }

    const fullPath = resolve(realProjectPath, filePath.startsWith('/') ? filePath.slice(1) : filePath);

    if (!fullPath.startsWith(realProjectPath)) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    return c.json({ content });
  } catch {
    return c.json({ error: 'Failed to read file' }, 500);
  }
});

const getSessionFolderRoute = createRoute({
  method: 'get',
  path: '/{projectName}/{sessionId}/folder',
  tags: ['Sessions'],
  request: {
    params: z.object({
      projectName: z.string(),
      sessionId: z.string()
    }),
    query: z.object({
      path: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: FolderEntriesSchema
        }
      },
      description: 'Returns folder entries'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Path parameter is required'
    },
    403: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Access denied'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Project path not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to read folder'
    }
  }
});

sessionsRouter.openapi(getSessionFolderRoute, async (c) => {
  try {
    const { projectName } = c.req.param();
    const { path: folderPath } = c.req.query();

    if (!folderPath) {
      return c.json({ error: 'Path parameter is required' }, 400);
    }

    const projectPath = join(os.homedir(), '.claude', 'projects', projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    if (!realProjectPath) {
      return c.json({ error: 'Project path not found' }, 404);
    }

    const fullPath = resolve(realProjectPath, folderPath.startsWith('/') ? folderPath.slice(1) : folderPath);

    if (!fullPath.startsWith(realProjectPath)) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const dirEntries = await fs.readdir(fullPath, { withFileTypes: true });
    const entries = dirEntries
      .filter((entry) => !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        path: join(folderPath, entry.name),
        type: entry.isDirectory() ? ('directory' as const) : ('file' as const)
      }))
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });

    return c.json({ entries });
  } catch {
    return c.json({ error: 'Failed to read folder' }, 500);
  }
});

const toggleSessionLabelRoute = createRoute({
  method: 'post',
  path: '/{projectName}/{sessionId}/labels',
  tags: ['Sessions'],
  request: {
    params: z.object({
      projectName: z.string(),
      sessionId: z.string()
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            labelId: z.string()
          })
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LabelsResponseSchema
        }
      },
      description: 'Label toggled successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'labelId is required'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Session not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to toggle label'
    }
  }
});

sessionsRouter.openapi(toggleSessionLabelRoute, async (c) => {
  try {
    const { projectName, sessionId } = c.req.param();
    const { labelId } = await c.req.json();

    if (!labelId) {
      return c.json({ error: 'labelId is required' }, 400);
    }

    const sessionsPath = join(os.homedir(), '.claude', 'projects', projectName);
    const sessionFile = join(sessionsPath, `${sessionId}.jsonl`);

    try {
      await fs.access(sessionFile);
    } catch {
      return c.json({ error: 'Session not found' }, 404);
    }

    const metadataPath = join(sessionsPath, '.metadata', `${sessionId}.json`);

    await fs.mkdir(dirname(metadataPath), { recursive: true });

    let metadata: { labels?: string[] } = {};
    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(content);
    } catch {
      metadata = { labels: [] };
    }

    if (!metadata.labels) {
      metadata.labels = [];
    }

    const labelIndex = metadata.labels.indexOf(labelId);
    if (labelIndex === -1) {
      metadata.labels = [labelId];
    } else {
      metadata.labels = [];
    }

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return c.json({ success: true, labels: metadata.labels });
  } catch (error) {
    return c.json({ error: 'Failed to toggle label', details: String(error) }, 500);
  }
});

const getSessionPathsRoute = createRoute({
  method: 'get',
  path: '/{projectName}/{sessionId}/paths',
  tags: ['Sessions'],
  request: {
    params: z.object({
      projectName: z.string(),
      sessionId: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(PathValidationSchema)
        }
      },
      description: 'Returns validated paths'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Project path not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to validate paths'
    }
  }
});

sessionsRouter.openapi(getSessionPathsRoute, async (c) => {
  try {
    const { projectName, sessionId } = c.req.param();
    const sessionFile = join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);

    const content = await fs.readFile(sessionFile, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    const projectPath = join(os.homedir(), '.claude', 'projects', projectName);
    const realProjectPath = await getRealPathFromSession(projectPath);

    if (!realProjectPath) {
      return c.json({ error: 'Project path not found' }, 404);
    }

    const pathsSet = new Set<string>();

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'user') {
          const textContent = extractTextContent(parsed.message?.content);
          const paths = extractPathsFromText(textContent);
          for (const path of paths) {
            pathsSet.add(path);
          }
        }
      } catch {}
    }

    const results = await Promise.all(
      Array.from(pathsSet).map(async (pathStr) => {
        try {
          const cleanPath = pathStr.startsWith('/') ? pathStr.slice(1) : pathStr;
          const fullPath = resolve(realProjectPath, cleanPath);
          if (!fullPath.startsWith(realProjectPath)) {
            return { path: pathStr, exists: false };
          }
          await fs.access(fullPath);
          return { path: pathStr, exists: true };
        } catch {
          return { path: pathStr, exists: false };
        }
      })
    );

    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to validate paths' }, 500);
  }
});

const deleteSessionRoute = createRoute({
  method: 'delete',
  path: '/{projectName}/{sessionId}',
  tags: ['Sessions'],
  request: {
    params: z.object({
      projectName: z.string(),
      sessionId: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessSchema
        }
      },
      description: 'Session deleted successfully'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to delete session'
    }
  }
});

sessionsRouter.openapi(deleteSessionRoute, async (c) => {
  try {
    const { projectName, sessionId } = c.req.param();
    const filePath = join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);
    const metadataPath = join(os.homedir(), '.claude', 'projects', projectName, '.metadata', `${sessionId}.json`);

    await fs.unlink(filePath);

    try {
      await fs.unlink(metadataPath);
    } catch {}

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete session' }, 500);
  }
});
