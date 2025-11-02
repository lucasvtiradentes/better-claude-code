import * as fs from 'fs';
import { CONFIG_PATHS } from './constants.js';
import type { BccConfig } from './types.js';

export class ConfigManager {
  private config: BccConfig | null = null;

  constructor() {
    this.ensureConfigDirectory();
  }

  private ensureConfigDirectory(): void {
    if (!fs.existsSync(CONFIG_PATHS.configDir)) {
      fs.mkdirSync(CONFIG_PATHS.configDir, { recursive: true });
    }
  }

  private loadConfig(): BccConfig {
    if (this.config) {
      return this.config;
    }

    if (!fs.existsSync(CONFIG_PATHS.defaultConfigFile)) {
      this.createDefaultConfig();
    }

    try {
      const data = fs.readFileSync(CONFIG_PATHS.defaultConfigFile, 'utf-8');
      const parsedConfig: BccConfig = JSON.parse(data);
      this.config = parsedConfig;
      return parsedConfig;
    } catch (error) {
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createDefaultConfig(): void {
    const defaultConfig: BccConfig = {};
    fs.writeFileSync(CONFIG_PATHS.defaultConfigFile, JSON.stringify(defaultConfig, null, 2));
  }

  private saveConfig(): void {
    if (!this.config) {
      throw new Error('No config to save');
    }
    fs.writeFileSync(CONFIG_PATHS.defaultConfigFile, JSON.stringify(this.config, null, 2));
  }

  markCompletionInstalled(): void {
    const config = this.loadConfig();
    config.completion_installed = true;
    this.config = config;
    this.saveConfig();
  }

  isCompletionInstalled(): boolean {
    const config = this.loadConfig();
    return config.completion_installed === true;
  }
}
