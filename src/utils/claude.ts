import { existsSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';

import { execAsync } from './exec.js';

export function getClaudePath(): string {
  const currentPlatform = platform();
  const homeDir = homedir();

  switch (currentPlatform) {
    case 'darwin':
    case 'linux':
      return join(homeDir, '.claude', 'local', 'claude');
    case 'win32':
      return join(homeDir, '.claude', 'local', 'claude.exe');
    default:
      throw new Error(`Unsupported platform: ${currentPlatform}`);
  }
}

export function validateClaudeBinary(): void {
  const claudePath = getClaudePath();

  if (!existsSync(claudePath)) {
    throw new Error(`Claude Code binary not found at: ${claudePath}`);
  }
}

export async function executePromptNonInteractively(prompt: string): Promise<void> {
  validateClaudeBinary();

  const claudePath = getClaudePath();
  const escapedPrompt = prompt.replace(/"/g, '\\"');

  await execAsync(`"${claudePath}" --dangerously-skip-permissions -p "${escapedPrompt}"`);
}
