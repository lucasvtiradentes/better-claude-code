import { accessSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { BCC_SETTINGS_PATH } from '@better-claude-code/node-utils';
import { AppSettings } from '../../common/schemas';

const SETTINGS_PATH = BCC_SETTINGS_PATH;

const DEFAULT_SETTINGS: AppSettings = {
  projects: {
    display: {
      showSessionCount: true,
      showCurrentBranch: true,
      showActionButtons: true,
      showProjectLabel: true
    },
    labels: [
      { id: 'personal', name: 'Personal', color: '#0e639c', projects: [] },
      { id: 'work', name: 'Work', color: '#00875a', projects: [] }
    ],
    hiddenProjects: []
  },
  sessions: {
    display: {
      showTokenPercentage: true,
      showAttachments: true
    },
    labels: [{ id: 'important', name: 'Important', color: '#f59e0b', sessions: {} }]
  }
};

async function ensureSettingsFile() {
  try {
    mkdirSync(dirname(SETTINGS_PATH), { recursive: true });
    accessSync(SETTINGS_PATH);
  } catch {
    writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
}

export async function readSettings(): Promise<AppSettings> {
  await ensureSettingsFile();
  const content = readFileSync(SETTINGS_PATH, 'utf-8');
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

export async function writeSettings(settings: AppSettings) {
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
