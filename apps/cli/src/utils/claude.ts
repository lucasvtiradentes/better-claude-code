import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';

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

  return new Promise((resolve, reject) => {
    const child = spawn(claudePath, ['--dangerously-skip-permissions', '-p', prompt], {
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Claude Code exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}
