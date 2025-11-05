import { dirname, join } from 'node:path';
import { promises as fs } from 'fs';
import os from 'os';

type AppSettings = {
  projects: {
    groupBy: 'date' | 'label' | 'session-count';
    filters: {
      selectedLabels: string[];
    };
    display: {
      showSessionCount: boolean;
      showCurrentBranch: boolean;
      showActionButtons: boolean;
      showProjectLabel: boolean;
    };
    search: string;
    labels: Array<{ id: string; name: string; color: string }>;
    projectSettings: Record<string, { labels: string[]; hidden: boolean }>;
  };
  sessions: {
    groupBy: 'date' | 'token-percentage' | 'label';
    filters: Record<string, unknown>;
    display: {
      showTokenPercentage: boolean;
      showAttachments: boolean;
    };
    labels: Array<{ id: string; name: string; color: string }>;
  };
};

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

export async function readSettings(): Promise<AppSettings> {
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

export async function writeSettings(settings: AppSettings): Promise<void> {
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
