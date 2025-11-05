import { homedir } from 'node:os';
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
}
