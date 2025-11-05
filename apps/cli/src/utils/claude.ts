import { spawn } from 'child_process';
import { ClaudeHelper } from '@better-claude-code/node-utils';

export async function executePromptNonInteractively(prompt: string): Promise<void> {
  ClaudeHelper.validateClaudeBinary();

  const claudePath = ClaudeHelper.getClaudeBinaryPath();

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
