import { dirname, join } from 'node:path';
import type { AppSettings, ProjectLabel } from '@better-claude-code/shared';
import express, { Router, type Router as RouterType } from 'express';
import { promises as fs } from 'fs';
import os from 'os';

export const settingsRouter: RouterType = Router();

settingsRouter.use(express.json());

const SETTINGS_PATH = join(os.homedir(), '.config', 'bcc', 'settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  projects: {
    groupBy: 'date',
    filters: {
      selectedLabels: [] as string[]
    },
    display: {
      showSessionCount: true,
      showCurrentBranch: true,
      showActionButtons: true,
      showProjectLabel: true
    },
    search: '',
    labels: [
      { id: 'personal', name: 'Personal', color: '#0e639c' },
      { id: 'work', name: 'Work', color: '#00875a' }
    ],
    projectSettings: {}
  },
  sessions: {
    groupBy: 'date',
    filters: {},
    display: {
      showTokenPercentage: true,
      showAttachments: false
    },
    labels: [{ id: 'important', name: 'Important', color: '#f59e0b' }]
  }
};

async function ensureSettingsFile(): Promise<void> {
  try {
    await fs.mkdir(dirname(SETTINGS_PATH), { recursive: true });
    await fs.access(SETTINGS_PATH);
  } catch {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
}

async function readSettings(): Promise<AppSettings> {
  await ensureSettingsFile();
  const content = await fs.readFile(SETTINGS_PATH, 'utf-8');
  const settings = JSON.parse(content) as Partial<AppSettings>;

  let needsUpdate = false;

  if (!settings.sessions) {
    settings.sessions = DEFAULT_SETTINGS.sessions;
    needsUpdate = true;
  }

  if (!settings.projects) {
    settings.projects = DEFAULT_SETTINGS.projects;
    needsUpdate = true;
  }

  if (needsUpdate) {
    await writeSettings(settings as AppSettings);
  }

  return settings as AppSettings;
}

async function writeSettings(settings: AppSettings): Promise<void> {
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

settingsRouter.get('/', async (_req, res) => {
  try {
    const settings = await readSettings();
    res.json(settings);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

settingsRouter.patch('/', async (req, res) => {
  try {
    const settings = await readSettings();
    const updates = req.body;

    if (updates.projects) {
      settings.projects = { ...settings.projects, ...updates.projects };
    }

    if (updates.sessions) {
      settings.sessions = { ...settings.sessions, ...updates.sessions };
    }

    await writeSettings(settings);
    res.json(settings);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

settingsRouter.patch('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const settings = await readSettings();

    if (!settings.projects.projectSettings[projectId]) {
      settings.projects.projectSettings[projectId] = {
        labels: [],
        hidden: false
      };
    }

    const updates = req.body;
    if (updates.labels !== undefined) {
      settings.projects.projectSettings[projectId].labels = updates.labels;
    }
    if (updates.hidden !== undefined) {
      settings.projects.projectSettings[projectId].hidden = updates.hidden;
    }

    await writeSettings(settings);
    res.json(settings.projects.projectSettings[projectId]);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to update project settings' });
  }
});

settingsRouter.post('/labels', async (req, res) => {
  try {
    const settings = await readSettings();
    const newLabel: ProjectLabel = req.body;

    if (!newLabel.id || !newLabel.name || !newLabel.color) {
      return res.status(400).json({ error: 'Invalid label data' });
    }

    settings.projects.labels.push(newLabel);
    await writeSettings(settings);
    res.json(newLabel);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to create label' });
  }
});

settingsRouter.patch('/labels/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const settings = await readSettings();
    const labelIndex = settings.projects.labels.findIndex((l) => l.id === labelId);

    if (labelIndex === -1) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const updates = req.body;
    if (updates.name !== undefined) {
      settings.projects.labels[labelIndex].name = updates.name;
    }
    if (updates.color !== undefined) {
      settings.projects.labels[labelIndex].color = updates.color;
    }

    await writeSettings(settings);
    res.json(settings.projects.labels[labelIndex]);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to update label' });
  }
});

settingsRouter.delete('/labels/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const settings = await readSettings();

    settings.projects.labels = settings.projects.labels.filter((l) => l.id !== labelId);

    for (const projectId in settings.projects.projectSettings) {
      settings.projects.projectSettings[projectId].labels = settings.projects.projectSettings[projectId].labels.filter(
        (id) => id !== labelId
      );
    }

    await writeSettings(settings);
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

settingsRouter.post('/sessions/labels', async (req, res) => {
  try {
    const settings = await readSettings();
    const newLabel: ProjectLabel = req.body;

    if (!newLabel.id || !newLabel.name || !newLabel.color) {
      return res.status(400).json({ error: 'Invalid label data' });
    }

    settings.sessions.labels.push(newLabel);
    await writeSettings(settings);
    res.json(newLabel);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to create label' });
  }
});

settingsRouter.patch('/sessions/labels/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const settings = await readSettings();
    const labelIndex = settings.sessions.labels.findIndex((l) => l.id === labelId);

    if (labelIndex === -1) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const updates = req.body;
    if (updates.name !== undefined) {
      settings.sessions.labels[labelIndex].name = updates.name;
    }
    if (updates.color !== undefined) {
      settings.sessions.labels[labelIndex].color = updates.color;
    }

    await writeSettings(settings);
    res.json(settings.sessions.labels[labelIndex]);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to update label' });
  }
});

settingsRouter.delete('/sessions/labels/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const settings = await readSettings();

    settings.sessions.labels = settings.sessions.labels.filter((l) => l.id !== labelId);

    await writeSettings(settings);
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to delete label' });
  }
});
