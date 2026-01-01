import { mkdirSync } from 'node:fs';
import { homedir, platform, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export enum PromptFile {
  SESSION_COMPACTION = 'session-compaction.prompt.md'
}

const USER_HOME_DIR = homedir();
const USER_TMP_DIR = tmpdir();
export const USER_PLATFORM = platform();

const BCC_CONFIG_DIR = join(USER_HOME_DIR, '.config', 'bcc');
export const BCC_SETTINGS_PATH = join(BCC_CONFIG_DIR, 'settings.json');
const BCC_CACHE_DIR = join(BCC_CONFIG_DIR, 'cache');
export const BCC_SESSIONS_CACHE_DIR = join(BCC_CACHE_DIR, 'sessions');
const BCC_SESSIONS_COMPACTED_DIR = join(BCC_CONFIG_DIR, 'compacted');
export const BCC_EXTENSION_LOG_FILE = join(USER_TMP_DIR, 'bcc_logs.txt');

export const CLAUDE_CODE_DIR = join(USER_HOME_DIR, '.claude');
export const CLAUDE_CODE_SETTINGS_PATH = join(CLAUDE_CODE_DIR, 'settings.json');
export const CLAUDE_CODE_INSTRUCTIONS_PATH = join(CLAUDE_CODE_DIR, 'CLAUDE.md');

function getCallerLocation(): string {
  const error = new Error();
  const stack = error.stack?.split('\n') || [];

  for (const line of stack) {
    if (line.includes('.vscode/extensions') && line.includes('better-claude-code-vscode')) {
      const match = line.match(/\(([^)]+\.vscode\/extensions\/[^)]+)\)/);
      if (match) {
        const fullPath = match[1].split(':')[0];
        return dirname(fullPath);
      }
    }
  }

  for (const line of stack) {
    if (line.includes('file://') && !line.includes('monorepo-path-utils')) {
      const match = line.match(/file:\/\/([^:)]+)/);
      if (match) {
        return dirname(match[1]);
      }
    }
  }

  return process.cwd();
}

const getCallerInfo = (): {
  callerDir: string;
  isDevMode: boolean;
} => {
  const callerLocation = getCallerLocation();

  if (callerLocation.includes('/src/out')) {
    return {
      callerDir: callerLocation,
      isDevMode: false
    };
  }

  if (callerLocation.includes('.vscode/extensions') && callerLocation.includes('better-claude-code-vscode')) {
    return {
      callerDir: callerLocation,
      isDevMode: false
    };
  }

  if (callerLocation.includes('/src/')) {
    return {
      callerDir: callerLocation,
      isDevMode: true
    };
  }

  return {
    callerDir: process.cwd(),
    isDevMode: false
  };
};

const { callerDir, isDevMode } = getCallerInfo();

function getExtensionRoot(baseDir: string, devMode: boolean): string {
  if (!devMode) {
    if (baseDir.includes('/src/out')) {
      const parts = baseDir.split('/src/out');
      return join(parts[0], 'src/out');
    }

    if (baseDir.includes('.vscode/extensions') && baseDir.includes('better-claude-code-vscode')) {
      const match = baseDir.match(/(.*\.vscode\/extensions\/[^/]*better-claude-code-vscode[^/]*)/);
      if (match) {
        return join(match[1], 'out');
      }
    }
  }

  if (baseDir.includes('/src/')) {
    const parts = baseDir.split('/src/');
    return parts[0];
  }

  if (baseDir.includes('node_modules/@better-claude-code')) {
    const parts = baseDir.split('node_modules');
    return parts[0];
  }

  return baseDir;
}

const EXTENSION_ROOT = getExtensionRoot(callerDir, isDevMode);
export const PROMPTS_FOLDER_FOR_EXTENSION = isDevMode
  ? join(EXTENSION_ROOT, 'resources')
  : join(EXTENSION_ROOT, '..', 'resources');

export function getPromptPathForExtension(promptFile: PromptFile): string {
  return join(PROMPTS_FOLDER_FOR_EXTENSION, promptFile);
}

export function getCompactionDir(normalizedProjectPath: string, sessionId: string): string {
  return join(BCC_SESSIONS_COMPACTED_DIR, normalizedProjectPath, sessionId);
}

export function getCompactionParsedPath(normalizedProjectPath: string, sessionId: string): string {
  return join(getCompactionDir(normalizedProjectPath, sessionId), 'parsed.md');
}

export function getCompactionSummaryPath(normalizedProjectPath: string, sessionId: string): string {
  return join(getCompactionDir(normalizedProjectPath, sessionId), 'summary.md');
}

export function ensureCompactionDirExists(normalizedProjectPath: string, sessionId: string): string {
  const compactionDir = getCompactionDir(normalizedProjectPath, sessionId);
  mkdirSync(compactionDir, { recursive: true });
  return compactionDir;
}
