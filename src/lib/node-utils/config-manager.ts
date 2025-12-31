import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform, release } from 'node:os';
import { join } from 'node:path';

export enum MessageCountMode {
  TURN = 'turn',
  EVENT = 'event'
}

export type BccConfig = {
  completion_installed?: boolean;
  messages_count_mode?: MessageCountMode;
};

type SupportedOS = 'linux' | 'mac' | 'windows' | 'wsl';

const DEFAULT_MESSAGE_COUNT_MODE = MessageCountMode.EVENT;
const APP_CLI_NAME = 'bcc';

function getUserOS(): SupportedOS {
  const platformOs = platform();

  if (platformOs === 'linux') {
    try {
      const releaseInfo = release().toLowerCase();
      if (releaseInfo.includes('microsoft') || releaseInfo.includes('wsl')) {
        return 'wsl';
      }
    } catch {}
    return 'linux';
  }

  if (platformOs === 'darwin') return 'mac';
  if (platformOs === 'win32') return 'windows';

  throw new Error(`Unsupported OS: ${platformOs}`);
}

function getConfigDirectory(): string {
  const userOS = getUserOS();
  const homeDir = homedir();

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

const CONFIG_PATHS = {
  configDir: getConfigDirectory(),
  defaultConfigFile: join(getConfigDirectory(), 'config.json')
};

export class ConfigManager {
  private config: BccConfig | null = null;

  constructor() {
    this.ensureConfigDirectory();
  }

  private ensureConfigDirectory() {
    if (!existsSync(CONFIG_PATHS.configDir)) {
      mkdirSync(CONFIG_PATHS.configDir, { recursive: true });
    }
  }

  private loadConfig(): BccConfig {
    if (this.config) {
      return this.config;
    }

    if (!existsSync(CONFIG_PATHS.defaultConfigFile)) {
      this.createDefaultConfig();
    }

    try {
      const data = readFileSync(CONFIG_PATHS.defaultConfigFile, 'utf-8');
      const parsedConfig: BccConfig = JSON.parse(data);
      this.config = parsedConfig;
      return parsedConfig;
    } catch (error) {
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createDefaultConfig() {
    const defaultConfig: BccConfig = {
      messages_count_mode: DEFAULT_MESSAGE_COUNT_MODE
    };
    writeFileSync(CONFIG_PATHS.defaultConfigFile, JSON.stringify(defaultConfig, null, 2));
  }

  private saveConfig() {
    if (!this.config) {
      throw new Error('No config to save');
    }
    writeFileSync(CONFIG_PATHS.defaultConfigFile, JSON.stringify(this.config, null, 2));
  }

  markCompletionInstalled() {
    const config = this.loadConfig();
    config.completion_installed = true;
    this.config = config;
    this.saveConfig();
  }

  isCompletionInstalled() {
    const config = this.loadConfig();
    return config.completion_installed === true;
  }

  getMessageCountMode(): MessageCountMode {
    const config = this.loadConfig();
    const mode = String(config.messages_count_mode || '');

    if (mode === MessageCountMode.TURN) {
      return MessageCountMode.TURN;
    }

    return MessageCountMode.EVENT;
  }

  setMessageCountMode(mode: MessageCountMode) {
    const config = this.loadConfig();
    config.messages_count_mode = mode;
    this.config = config;
    this.saveConfig();
  }
}
