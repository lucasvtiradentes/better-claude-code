import { accessSync, constants, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';

import { ConfigManager } from '../../config/config-manager.js';
import { createSubCommandFromSchema } from '../../definitions/command-builder.js';
import { generateBashCompletion, generateZshCompletion } from '../../definitions/generators/completion-generator.js';
import { CommandNames, SubCommandNames } from '../../definitions/types.js';
import { colors } from '../../utils/colors.js';
import { Logger } from '../../utils/logger.js';
import { detectShell } from './utils.js';

const ZSH_COMPLETION_SCRIPT = generateZshCompletion();
const BASH_COMPLETION_SCRIPT = generateBashCompletion();

export function createInstallCommand(): Command {
  const installCompletionCommand = async () => {
    const shell = detectShell();

    switch (shell) {
      case 'zsh':
        await installZshCompletion();
        break;
      case 'bash':
        await installBashCompletion();
        break;
      default:
        Logger.error(`Unsupported shell: ${shell}`);
        Logger.info('');
        Logger.info('🐚 Supported shells: zsh, bash');
        Logger.info('💡 Please switch to a supported shell to use autocompletion');
        process.exit(1);
    }

    const configManager = new ConfigManager();
    configManager.markCompletionInstalled();
  };

  return createSubCommandFromSchema(
    CommandNames.COMPLETION,
    SubCommandNames.COMPLETION_INSTALL,
    installCompletionCommand,
    'Failed to install completion'
  );
}

async function installZshCompletion() {
  const homeDir = homedir();

  const possibleDirs = [
    join(homeDir, '.oh-my-zsh', 'completions'),
    join(homeDir, '.zsh', 'completions'),
    join(homeDir, '.config', 'zsh', 'completions'),
    join(homeDir, '.local', 'share', 'zsh', 'site-functions'),
    '/usr/local/share/zsh/site-functions'
  ];

  let targetDir: string | null = null;

  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  if (!targetDir) {
    targetDir = join(homeDir, '.zsh', 'completions');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, '_bcc');
  writeFileSync(completionFile, ZSH_COMPLETION_SCRIPT);

  Logger.success(`Zsh completion installed to ${completionFile}`);
  Logger.info('');
  Logger.info('To activate completion, add this to your ~/.zshrc:');
  Logger.info(colors.cyan(`  fpath=(${targetDir} $fpath)`));
  Logger.info(colors.cyan('  autoload -U compinit && compinit'));
  Logger.info('');
  Logger.info('Then restart your shell or run:');
  Logger.info(colors.cyan('  source ~/.zshrc'));

  try {
    const zshrc = join(homeDir, '.zshrc');
    if (existsSync(zshrc)) {
      const zshrcContent = readFileSync(zshrc, 'utf8');
      if (!zshrcContent.includes(targetDir)) {
        Logger.info('');
        Logger.warning('Remember to add the fpath line to your ~/.zshrc for autocompletion to work!');
      }
    }
  } catch (_error) {}
}

async function installBashCompletion() {
  const homeDir = homedir();

  const possibleDirs = [
    join(homeDir, '.bash_completion.d'),
    join(homeDir, '.local', 'share', 'bash-completion', 'completions'),
    '/usr/local/etc/bash_completion.d',
    '/etc/bash_completion.d'
  ];

  let targetDir: string | null = null;

  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  if (!targetDir) {
    targetDir = join(homeDir, '.bash_completion.d');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, 'bcc');
  writeFileSync(completionFile, BASH_COMPLETION_SCRIPT);

  Logger.success(`Bash completion installed to ${completionFile}`);
  Logger.info('');
  Logger.info('To activate completion, add this to your ~/.bashrc:');
  Logger.info(colors.cyan(`  source ${completionFile}`));
  Logger.info('');
  Logger.info('Then restart your shell or run:');
  Logger.info(colors.cyan('  source ~/.bashrc'));
}

export async function installZshCompletionSilent() {
  const homeDir = homedir();

  const possibleDirs = [
    join(homeDir, '.oh-my-zsh', 'completions'),
    join(homeDir, '.zsh', 'completions'),
    join(homeDir, '.config', 'zsh', 'completions'),
    join(homeDir, '.local', 'share', 'zsh', 'site-functions'),
    '/usr/local/share/zsh/site-functions'
  ];

  let targetDir: string | null = null;

  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  if (!targetDir) {
    targetDir = join(homeDir, '.zsh', 'completions');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, '_bcc');
  writeFileSync(completionFile, ZSH_COMPLETION_SCRIPT);
}

export async function installBashCompletionSilent() {
  const homeDir = homedir();

  const possibleDirs = [
    join(homeDir, '.bash_completion.d'),
    join(homeDir, '.local', 'share', 'bash-completion', 'completions'),
    '/usr/local/etc/bash_completion.d',
    '/etc/bash_completion.d'
  ];

  let targetDir: string | null = null;

  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  if (!targetDir) {
    targetDir = join(homeDir, '.bash_completion.d');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, 'bcc');
  writeFileSync(completionFile, BASH_COMPLETION_SCRIPT);
}
