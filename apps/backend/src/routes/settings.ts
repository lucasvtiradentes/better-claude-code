import type { AppSettings, ProjectLabel } from '@bcc/shared';
import express, { Router, type Router as RouterType } from 'express';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export const settingsRouter: RouterType = Router();

settingsRouter.use(express.json());

const SETTINGS_PATH = path.join(os.homedir(), '.config', 'bcc', 'settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  projects: {
    groupBy: 'date',
    filters: {
      showOnlyGitProjects: false,
      selectedLabels: []
    },
    display: {
      showSessionCount: true,
      showCurrentBranch: true,
      showActionButtons: true,
      showProjectLabel: true,
      showPathInCards: true
    },
    search: '',
    labels: [
      { id: 'personal', name: 'Personal', color: '#0e639c' },
      { id: 'work', name: 'Work', color: '#00875a' }
    ],
    projectSettings: {}
  }
};

async function ensureSettingsFile(): Promise<void> {
  try {
    await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
    await fs.access(SETTINGS_PATH);
  } catch {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
}

async function readSettings(): Promise<AppSettings> {
  await ensureSettingsFile();
  const content = await fs.readFile(SETTINGS_PATH, 'utf-8');
  return JSON.parse(content);
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
