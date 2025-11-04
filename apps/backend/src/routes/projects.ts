// @ts-nocheck
import { join } from 'node:path';
import type { AppSettings } from '@better-claude-code/shared';
import { spawn } from 'child_process';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { promises as fs } from 'fs';
import os from 'os';
import { z } from 'zod';
import { ActionResponseSchema, ErrorSchema, ProjectSchema } from '../schemas.js';
import { execAsync } from '../utils/exec.js';

const SETTINGS_PATH = join(os.homedir(), '.config', 'bcc', 'settings.json');

async function readSettings(): Promise<AppSettings | null> {
  try {
    const content = await fs.readFile(SETTINGS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export const projectsRouter = new OpenAPIHono();

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

function extractProjectName(fullPath: string): string {
  const parts = fullPath.split('/').filter(Boolean);
  return parts[parts.length - 1] || fullPath;
}

async function getGitHubUrl(projectPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('git config --get remote.origin.url', { cwd: projectPath });
    const url = stdout.trim();

    if (!url) return undefined;

    if (url.startsWith('https://github.com/')) {
      return url.replace(/\.git$/, '');
    }

    if (url.startsWith('git@github.com:')) {
      return url.replace('git@github.com:', 'https://github.com/').replace(/\.git$/, '');
    }

    return undefined;
  } catch {
    return undefined;
  }
}

async function getCurrentBranch(projectPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('git branch --show-current', { cwd: projectPath });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

const getProjectsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Projects'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(ProjectSchema)
        }
      },
      description: 'Returns all projects'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Failed to read projects'
    }
  }
});

projectsRouter.openapi(getProjectsRoute, async (c) => {
  try {
    const projectsPath = join(os.homedir(), '.claude', 'projects');
    const folders = await fs.readdir(projectsPath);

    const settings = await readSettings();

    const projects: any[] = [];

    for (const folder of folders) {
      const folderPath = join(projectsPath, folder);
      const stats = await fs.stat(folderPath);

      if (!stats.isDirectory()) continue;

      const realPath = await getRealPathFromSession(folderPath);

      if (!realPath) continue;

      const sessionFiles = await fs
        .readdir(folderPath)
        .then((files) => files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-')))
        .catch(() => []);

      const sessionsCount = sessionFiles.length;

      const fileStats = await Promise.all(sessionFiles.map((f) => fs.stat(join(folderPath, f)).then((s) => s.mtimeMs)));
      const lastModified = Math.max(...fileStats, stats.mtimeMs);

      let isGitRepo = false;
      let githubUrl: string | undefined;
      let currentBranch: string | undefined;
      try {
        await fs.access(join(realPath, '.git'));
        isGitRepo = true;
        githubUrl = await getGitHubUrl(realPath);
        currentBranch = await getCurrentBranch(realPath);
      } catch {
        isGitRepo = false;
      }

      const name = extractProjectName(realPath);
      const displayPath = realPath.replace(os.homedir(), '~');

      const projectSettings = settings?.projects.projectSettings[folder];

      projects.push({
        id: folder,
        name,
        path: displayPath,
        sessionsCount,
        lastModified,
        isGitRepo,
        githubUrl,
        currentBranch,
        labels: projectSettings?.labels || [],
        hidden: projectSettings?.hidden || false
      });
    }

    projects.sort((a, b) => b.lastModified - a.lastModified);

    return c.json(projects);
  } catch {
    return c.json({ error: 'Failed to read projects' }, 500);
  }
});

const executeProjectActionRoute = createRoute({
  method: 'post',
  path: '/{projectId}/action/{action}',
  tags: ['Projects'],
  request: {
    params: z.object({
      projectId: z.string(),
      action: z.enum(['openFolder', 'openCodeEditor', 'openTerminal'])
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ActionResponseSchema
        }
      },
      description: 'Action executed successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Invalid action'
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
      description: 'Failed to execute action'
    }
  }
});

projectsRouter.openapi(executeProjectActionRoute, async (c) => {
  try {
    const { projectId, action } = c.req.param();

    if (!['openFolder', 'openCodeEditor', 'openTerminal'].includes(action)) {
      return c.json({ error: 'Invalid action' }, 400);
    }

    const projectPath = join(os.homedir(), '.claude', 'projects', projectId);
    const realPath = await getRealPathFromSession(projectPath);

    if (!realPath) {
      return c.json({ error: 'Project path not found' }, 404);
    }

    const platform = process.platform;

    let command: string;
    let args: string[];

    switch (action) {
      case 'openFolder':
        if (platform === 'darwin') {
          command = 'open';
          args = [realPath];
        } else if (platform === 'win32') {
          command = 'explorer';
          args = [realPath];
        } else {
          command = 'xdg-open';
          args = [realPath];
        }
        break;

      case 'openTerminal':
        if (platform === 'darwin') {
          command = 'open';
          args = ['-a', 'Terminal', realPath];
        } else if (platform === 'win32') {
          command = 'cmd';
          args = ['/c', 'start', 'cmd', '/K', `cd /d "${realPath}"`];
        } else {
          command = 'sh';
          args = [
            '-c',
            `cd "${realPath}" && (gnome-terminal --working-directory="${realPath}" || konsole --workdir "${realPath}" || xfce4-terminal --working-directory="${realPath}" || x-terminal-emulator || xterm)`
          ];
        }
        break;

      case 'openCodeEditor':
        command = 'code';
        args = [realPath];
        break;

      default:
        return c.json({ error: 'Invalid action' }, 400);
    }

    spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      shell: platform === 'win32'
    }).unref();

    return c.json({ success: true, action, path: realPath });
  } catch {
    return c.json({ error: 'Failed to execute action' }, 500);
  }
});
