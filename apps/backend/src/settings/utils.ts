import { dirname, join } from 'node:path';
import { promises as fs } from 'fs';
import os from 'os';
import type { z } from 'zod';
import { AppSettingsSchema } from './schemas.js';

const SETTINGS_PATH = join(os.homedir(), '.config', 'bcc', 'settings.json');

const DEFAULT_SETTINGS: z.infer<typeof AppSettingsSchema> = {
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

export async function readSettings(): Promise<z.infer<typeof AppSettingsSchema>> {
  await ensureSettingsFile();
  const content = await fs.readFile(SETTINGS_PATH, 'utf-8');
  const settings = JSON.parse(content) as Partial<z.infer<typeof AppSettingsSchema>>;

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
    await writeSettings(settings as z.infer<typeof AppSettingsSchema>);
  }

  return settings as z.infer<typeof AppSettingsSchema>;
}

export async function writeSettings(settings: z.infer<typeof AppSettingsSchema>): Promise<void> {
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
