import { existsSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

export class ClaudeHelper {
  static getClaudeDir(): string {
    return join(homedir(), '.claude');
  }

  static getProjectsDir(): string {
    return join(ClaudeHelper.getClaudeDir(), 'projects');
  }

  static getProjectDir(projectName: string): string {
    return join(ClaudeHelper.getProjectsDir(), projectName);
  }

  static getSessionPath(projectName: string, sessionId: string): string {
    return join(ClaudeHelper.getProjectDir(projectName), `${sessionId}.jsonl`);
  }

  static getSessionMetadataPath(projectName: string, sessionId: string): string {
    return join(ClaudeHelper.getProjectDir(projectName), '.metadata', `${sessionId}.json`);
  }

  static getSessionsPath(projectName: string): string {
    return ClaudeHelper.getProjectDir(projectName);
  }

  static getClaudeBinaryPath(): string {
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

  static validateClaudeBinary(): void {
    const claudePath = ClaudeHelper.getClaudeBinaryPath();

    if (!existsSync(claudePath)) {
      throw new Error(`Claude Code binary not found at: ${claudePath}`);
    }
  }

  static normalizePathForClaudeProjects(dirPath: string): string {
    return dirPath.replace(/\/_/g, '--').replace(/\//g, '-').replace(/_/g, '-');
  }
}
