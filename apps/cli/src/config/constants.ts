import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_CLI_NAME } from '@better-claude-code/shared';
import * as os from 'os';
import { getPackageJsonPath } from '../utils/paths.js';

const packageJsonPath = getPackageJsonPath(import.meta.url);
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const APP_INFO = {
  version: packageJson.version
};

type SupportedOS = 'linux' | 'mac' | 'windows' | 'wsl';

export function getUserOS(): SupportedOS {
  const platform = os.platform();

  if (platform === 'linux') {
    try {
      const release = os.release().toLowerCase();
      if (release.includes('microsoft') || release.includes('wsl')) {
        return 'wsl';
      }
    } catch {}
    return 'linux';
  }

  if (platform === 'darwin') return 'mac';
  if (platform === 'win32') return 'windows';

  throw new Error(`Unsupported OS: ${platform}`);
}

export function getConfigDirectory() {
  const userOS = getUserOS();
  const homeDir = os.homedir();

  switch (userOS) {
    case 'linux':
    case 'wsl':
      return join(homeDir, '.config', APP_CLI_NAME);
    case 'mac':
      return join(homeDir, 'Library', 'Preferences', APP_CLI_NAME);
    case 'windows':
      return join(homeDir, 'AppData', 'Roaming', APP_CLI_NAME);
    default:
      throw new Error(`Unsupported OS: ${userOS}`);
  }
}

export const CONFIG_PATHS = {
  configDir: getConfigDirectory(),
  defaultConfigFile: join(getConfigDirectory(), 'config.json')
};
