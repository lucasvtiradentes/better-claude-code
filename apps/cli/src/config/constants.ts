import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { USER_HOME_DIR, USER_PLATFORM, USER_PLATFORM_RELEASE } from '@better-claude-code/node-utils';
import { APP_CLI_NAME } from '@better-claude-code/shared';
import { getPackageJsonPath } from '../utils/paths.js';

const packageJsonPath = getPackageJsonPath(import.meta.url);
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const APP_INFO = {
  version: packageJson.version
};

type SupportedOS = 'linux' | 'mac' | 'windows' | 'wsl';

export function getUserOS(): SupportedOS {
  const platformOs = USER_PLATFORM;

  if (platformOs === 'linux') {
    try {
      const release = USER_PLATFORM_RELEASE.toLowerCase();
      if (release.includes('microsoft') || release.includes('wsl')) {
        return 'wsl';
      }
    } catch {}
    return 'linux';
  }

  if (platformOs === 'darwin') return 'mac';
  if (platformOs === 'win32') return 'windows';

  throw new Error(`Unsupported OS: ${USER_PLATFORM}`);
}

export function getConfigDirectory() {
  const userOS = getUserOS();

  switch (userOS) {
    case 'linux':
    case 'wsl':
      return join(USER_HOME_DIR, '.config', APP_CLI_NAME);
    case 'mac':
      return join(USER_HOME_DIR, 'Library', 'Preferences', APP_CLI_NAME);
    case 'windows':
      return join(USER_HOME_DIR, 'AppData', 'Roaming', APP_CLI_NAME);
    default:
      throw new Error(`Unsupported OS: ${userOS}`);
  }
}

export const CONFIG_PATHS = {
  configDir: getConfigDirectory(),
  defaultConfigFile: join(getConfigDirectory(), 'config.json')
};
