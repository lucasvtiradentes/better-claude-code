import { dirname, join } from 'node:path';

export enum PromptFile {
  SESSION_COMPACTION = 'session-compaction.prompt.md'
}

function getCallerLocation(): string {
  const error = new Error();
  const stack = error.stack?.split('\n') || [];

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
  appType: 'cli' | 'backend' | 'extension' | 'unknown';
} => {
  const callerLocation = getCallerLocation();

  if (callerLocation.includes('/dist/apps/cli') || callerLocation.includes('/apps/cli/dist')) {
    return {
      callerDir: callerLocation,
      isDevMode: false,
      appType: 'cli'
    };
  }

  if (callerLocation.includes('/dist/apps/backend') || callerLocation.includes('/apps/backend/dist')) {
    return {
      callerDir: callerLocation,
      isDevMode: false,
      appType: 'backend'
    };
  }

  if (callerLocation.includes('/apps/vscode-extension/out')) {
    return {
      callerDir: callerLocation,
      isDevMode: false,
      appType: 'extension'
    };
  }

  if (callerLocation.includes('apps/cli')) {
    return {
      callerDir: callerLocation,
      isDevMode: true,
      appType: 'cli'
    };
  }

  if (callerLocation.includes('apps/backend')) {
    return {
      callerDir: callerLocation,
      isDevMode: true,
      appType: 'backend'
    };
  }

  if (callerLocation.includes('apps/vscode-extension')) {
    return {
      callerDir: callerLocation,
      isDevMode: true,
      appType: 'extension'
    };
  }

  return {
    callerDir: process.cwd(),
    isDevMode: false,
    appType: 'unknown'
  };
};

const { callerDir, isDevMode, appType } = getCallerInfo();

export const isRunningCliInDevMode = isDevMode && appType === 'cli';
export const isRunningBackendInDevMode = isDevMode && appType === 'backend';
export const isRunningExtensionInDevMode = isDevMode && appType === 'extension';

function getRepoRoot(baseDir: string, type: 'cli' | 'backend' | 'extension', devMode: boolean): string {
  if (!devMode) {
    if (baseDir.includes('/dist/apps/cli')) {
      const parts = baseDir.split('/dist/apps/cli');
      return join(parts[0], 'dist');
    }

    if (baseDir.includes('/apps/cli/dist')) {
      const parts = baseDir.split('/apps/cli/dist');
      return join(parts[0], 'apps/cli/dist');
    }

    if (baseDir.includes('/dist/apps/backend')) {
      const parts = baseDir.split('/dist/apps/backend');
      return join(parts[0], 'dist');
    }

    if (baseDir.includes('/apps/backend/dist')) {
      const parts = baseDir.split('/apps/backend/dist');
      return join(parts[0], 'apps/backend/dist');
    }

    if (baseDir.includes('/apps/vscode-extension/out')) {
      const parts = baseDir.split('/apps/vscode-extension/out');
      return join(parts[0], 'apps/vscode-extension/out');
    }
  }

  if (baseDir.includes(`apps/${type}`)) {
    const parts = baseDir.split(`apps/${type}`);
    return join(parts[0]);
  }

  if (baseDir.includes('apps/')) {
    const parts = baseDir.split(/apps\/[^/]+/);
    return parts[0];
  }

  if (baseDir.includes('node_modules/@better-claude-code')) {
    const parts = baseDir.split('node_modules');
    return parts[0];
  }

  return baseDir;
}

export const REPO_ROOT_FROM_CLI = getRepoRoot(callerDir, 'cli', isDevMode);
export const REPO_ROOT_FROM_BACKEND = getRepoRoot(callerDir, 'backend', isDevMode);
export const REPO_ROOT_FROM_EXTENSION = getRepoRoot(callerDir, 'extension', isDevMode);

export const PROMPTS_FOLDER_FOR_CLI = join(REPO_ROOT_FROM_CLI, 'prompts');
export const PROMPTS_FOLDER_FOR_BACKEND = join(REPO_ROOT_FROM_BACKEND, 'prompts');
export const PROMPTS_FOLDER_FOR_EXTENSION = join(REPO_ROOT_FROM_EXTENSION, 'prompts');

export function getPromptPathForCli(promptFile: PromptFile): string {
  return join(PROMPTS_FOLDER_FOR_CLI, promptFile);
}

export function getPromptPathForBackend(promptFile: PromptFile): string {
  return join(PROMPTS_FOLDER_FOR_BACKEND, promptFile);
}

export function getPromptPathForExtension(promptFile: PromptFile): string {
  return join(PROMPTS_FOLDER_FOR_EXTENSION, promptFile);
}
