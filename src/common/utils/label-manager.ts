import { FileIOHelper, NodePathHelper } from '@/common/utils/helpers/node-helper';
import { BCC_SETTINGS_PATH } from './monorepo-path-utils';

const SETTINGS_PATH = BCC_SETTINGS_PATH;

export type SessionLabelSettings = {
  id: string;
  name: string;
  color: string;
  usageCount?: number;
  sessions?: Record<string, string[]>;
};

export type ProjectLabel = {
  id: string;
  name: string;
  color: string;
  usageCount?: number;
  projects?: string[];
};

export type AppSettings = {
  projects: {
    display: {
      showSessionCount: boolean;
      showCurrentBranch: boolean;
      showActionButtons: boolean;
      showProjectLabel: boolean;
    };
    labels: ProjectLabel[];
    hiddenProjects: string[];
  };
  sessions: {
    display: {
      showTokenPercentage: boolean;
      showAttachments: boolean;
    };
    labels: SessionLabelSettings[];
  };
};

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

function ensureSettingsFile() {
  try {
    FileIOHelper.ensureDirectoryExists(NodePathHelper.dirname(SETTINGS_PATH));
    FileIOHelper.accessSync(SETTINGS_PATH);
  } catch {
    FileIOHelper.writeFile(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
}

export function readSettings(): AppSettings {
  ensureSettingsFile();
  const content = FileIOHelper.readFile(SETTINGS_PATH);
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
    writeSettings(settings as AppSettings);
  }

  return settings as AppSettings;
}

function writeSettings(settings: AppSettings) {
  FileIOHelper.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

export function getSessionLabels(): SessionLabelSettings[] {
  const settings = readSettings();
  return settings.sessions.labels;
}

export function getSessionLabelsForSession(projectName: string, sessionId: string): string[] {
  const settings = readSettings();
  return settings.sessions.labels.filter((l) => l.sessions?.[projectName]?.includes(sessionId)).map((l) => l.id);
}

export function toggleSessionLabel(projectName: string, sessionId: string, labelId: string): string[] {
  const settings = readSettings();
  const label = settings.sessions.labels.find((l) => l.id === labelId);

  if (!label) {
    throw new Error('Label not found');
  }

  if (!label.sessions) {
    label.sessions = {};
  }

  if (!label.sessions[projectName]) {
    label.sessions[projectName] = [];
  }

  const hadLabel = label.sessions[projectName].includes(sessionId);

  if (hadLabel) {
    label.sessions[projectName] = label.sessions[projectName].filter((id) => id !== sessionId);
    if (label.sessions[projectName].length === 0) {
      delete label.sessions[projectName];
    }
  } else {
    label.sessions[projectName].push(sessionId);
  }

  writeSettings(settings);

  return settings.sessions.labels.filter((l) => l.sessions?.[projectName]?.includes(sessionId)).map((l) => l.id);
}
