import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

export const CLAUDE_CODE_SESSION_COMPACTION_ID = 'CLAUDE_CODE_SESSION_COMPACTION_ID';

export class ClaudeHelper {
  static getClaudeDir() {
    return join(homedir(), '.claude');
  }

  static getProjectsDir() {
    return join(ClaudeHelper.getClaudeDir(), 'projects');
  }

  static getProjectDir(projectName: string) {
    return join(ClaudeHelper.getProjectsDir(), projectName);
  }

  static getSessionPath(projectName: string, sessionId: string) {
    return join(ClaudeHelper.getProjectDir(projectName), `${sessionId}.jsonl`);
  }

  static getSessionMetadataPath(projectName: string, sessionId: string) {
    return join(ClaudeHelper.getProjectDir(projectName), '.metadata', `${sessionId}.json`);
  }

  static getSessionsPath(projectName: string) {
    return ClaudeHelper.getProjectDir(projectName);
  }

  static getClaudeBinaryPath() {
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

  static validateClaudeBinary() {
    const claudePath = ClaudeHelper.getClaudeBinaryPath();

    if (!existsSync(claudePath)) {
      throw new Error(`Claude Code binary not found at: ${claudePath}`);
    }
  }

  static normalizePathForClaudeProjects(dirPath: string) {
    return dirPath.replace(/\/_/g, '--').replace(/\//g, '-').replace(/_/g, '-');
  }

  static isCompactionSession(lines: string[]) {
    try {
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'user') {
            const messageContent = parsed.message?.content;

            let textContent = '';
            if (typeof messageContent === 'string') {
              textContent = messageContent;
            } else if (Array.isArray(messageContent)) {
              const textPart = messageContent.find((item: any) => item.type === 'text');
              if (textPart?.text) {
                textContent = textPart.text;
              }
            }

            if (textContent && textContent !== 'Warmup' && !textContent.includes('Caveat:')) {
              return textContent.startsWith(CLAUDE_CODE_SESSION_COMPACTION_ID);
            }
          }
        } catch {}
      }

      return false;
    } catch {
      return false;
    }
  }

  static async executePromptNonInteractively(prompt: string) {
    ClaudeHelper.validateClaudeBinary();

    const claudePath = ClaudeHelper.getClaudeBinaryPath();

    return new Promise<void>((resolve, reject) => {
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
}
