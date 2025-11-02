import type { AppSettings, Project } from '@bcc/shared';
import { exec, spawn } from 'child_process';
import { Router, type Router as RouterType } from 'express';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SETTINGS_PATH = path.join(os.homedir(), '.config', 'bcc', 'settings.json');

async function readSettings(): Promise<AppSettings | null> {
  try {
    const content = await fs.readFile(SETTINGS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export const projectsRouter: RouterType = Router();

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

projectsRouter.get('/', async (_req, res) => {
  try {
    const projectsPath = path.join(os.homedir(), '.claude', 'projects');
    const folders = await fs.readdir(projectsPath);

    const settings = await readSettings();

    const projects: Project[] = [];

    for (const folder of folders) {
      const folderPath = path.join(projectsPath, folder);
      const stats = await fs.stat(folderPath);

      if (!stats.isDirectory()) continue;

      const realPath = await getRealPathFromSession(folderPath);

      if (!realPath) continue;

      const sessionFiles = await fs
        .readdir(folderPath)
        .then((files) => files.filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-')))
        .catch(() => []);

      const sessionsCount = sessionFiles.length;

      const fileStats = await Promise.all(
        sessionFiles.map((f) => fs.stat(path.join(folderPath, f)).then((s) => s.mtimeMs))
      );
      const lastModified = Math.max(...fileStats, stats.mtimeMs);

      let isGitRepo = false;
      let githubUrl: string | undefined;
      let currentBranch: string | undefined;
      try {
        await fs.access(path.join(realPath, '.git'));
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

    res.json(projects);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

projectsRouter.post('/:projectId/action/:action', async (req, res) => {
  try {
    const { projectId, action } = req.params;

    if (!['openFolder', 'openCodeEditor', 'openTerminal'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const projectPath = path.join(os.homedir(), '.claude', 'projects', projectId);
    const realPath = await getRealPathFromSession(projectPath);

    if (!realPath) {
      return res.status(404).json({ error: 'Project path not found' });
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
        return res.status(400).json({ error: 'Invalid action' });
    }

    spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      shell: platform === 'win32'
    }).unref();

    res.json({ success: true, action, path: realPath });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to execute action' });
  }
});
