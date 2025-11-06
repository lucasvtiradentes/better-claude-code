import { existsSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ConfigManager } from '../../config/config-manager.js';
import { ENV } from '../../env.js';
import { installBashCompletionSilent, installZshCompletionSilent } from './install.js';

export function detectShell() {
  const shell = ENV.SHELL || '';

  if (shell.includes('zsh')) {
    return 'zsh';
  } else if (shell.includes('bash')) {
    return 'bash';
  }

  return '';
}

export async function reinstallCompletionSilently() {
  const configManager = new ConfigManager();

  if (!configManager.isCompletionInstalled()) {
    return false;
  }

  const shell = detectShell();

  try {
    switch (shell) {
      case 'zsh':
        await installZshCompletionSilent();
        await clearZshCompletionCache();
        return true;
      case 'bash':
        await installBashCompletionSilent();
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

async function clearZshCompletionCache() {
  const homeDir = homedir();
  const zshCacheFile = join(homeDir, '.zcompdump');

  try {
    if (existsSync(zshCacheFile)) {
      unlinkSync(zshCacheFile);
    }
  } catch {}
}
