import { mkdirSync } from 'node:fs';
import { homedir, platform, release, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export enum PromptFile {
  SESSION_COMPACTION = 'session-compaction.prompt.md'
}

export const USER_HOME_DIR = homedir();
export const USER_TMP_DIR = tmpdir();
export const USER_PLATFORM = platform();
export const USER_PLATFORM_RELEASE = release();

export const BCC_CONFIG_DIR = join(USER_HOME_DIR, '.config', 'bcc');
export const BCC_SETTINGS_PATH = join(BCC_CONFIG_DIR, 'settings.json');
export const BCC_CACHE_DIR = join(BCC_CONFIG_DIR, 'cache');
export const BCC_SESSIONS_CACHE_DIR = join(BCC_CACHE_DIR, 'sessions');
export const BCC_PROJECTS_CACHE_DIR = join(BCC_CACHE_DIR, 'projects');
export const BCC_SESSIONS_COMPACTED_DIR = join(BCC_CONFIG_DIR, 'compacted');
export const BCC_EXTENSION_LOG_FILE = join(USER_TMP_DIR, 'bcc_logs.txt');

export const CLAUDE_CODE_DIR = join(USER_HOME_DIR, '.claude');
export const CLAUDE_CODE_SESSIONS_DIR = join(CLAUDE_CODE_DIR, 'sessions');
export const CLAUDE_CODE_PROJECTS_DIR = join(CLAUDE_CODE_DIR, 'projects');
export const CLAUDE_CODE_GLOBAL_CONFIG = join(CLAUDE_CODE_DIR, 'CLAUDE.md');
export const CLAUDE_CODE_CLI_PATH = join(CLAUDE_CODE_DIR, 'local/node_modules/@anthropic-ai/claude-code/cli.js');

export const VSCODE_EXTENSIONS_DIR = join(USER_HOME_DIR, '.vscode', 'extensions');

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

export const isRunningExtensionInDevMode = isDevMode;

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

export const EXTENSION_ROOT = getExtensionRoot(callerDir, isDevMode);
export const PROMPTS_FOLDER_FOR_EXTENSION = join(EXTENSION_ROOT, 'prompts');

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
