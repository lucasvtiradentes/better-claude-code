import { CLAUDE_CODE_DIR, USER_PLATFORM } from '../constants/monorepo-path-utils';
import { FileIOHelper, NodeChildProcessHelper, NodePathHelper } from '../utils/helpers/node-helper';

export const CLAUDE_CODE_SESSION_COMPACTION_ID = 'CLAUDE_CODE_SESSION_COMPACTION_ID';

export enum MessageSource {
  USER = 'user',
  CC = 'assistant'
}

export class ClaudeHelper {
  static getClaudeDir() {
    return CLAUDE_CODE_DIR;
  }

  static getProjectsDir() {
    return NodePathHelper.join(CLAUDE_CODE_DIR, 'projects');
  }

  static getProjectDir(projectName: string) {
    return NodePathHelper.join(ClaudeHelper.getProjectsDir(), projectName);
  }

  static getSessionPath(projectName: string, sessionId: string) {
    return NodePathHelper.join(ClaudeHelper.getProjectDir(projectName), `${sessionId}.jsonl`);
  }

  static getSessionMetadataPath(projectName: string, sessionId: string) {
    return NodePathHelper.join(ClaudeHelper.getProjectDir(projectName), '.metadata', `${sessionId}.json`);
  }

  static getSessionsPath(projectName: string) {
    return ClaudeHelper.getProjectDir(projectName);
  }

  static getClaudeBinaryPath() {
    const currentPlatform = USER_PLATFORM;

    switch (currentPlatform) {
      case 'darwin':
      case 'linux':
        return NodePathHelper.join(CLAUDE_CODE_DIR, 'local', 'claude');
      case 'win32':
        return NodePathHelper.join(CLAUDE_CODE_DIR, 'local', 'claude.exe');
      default:
        throw new Error(`Unsupported platform: ${currentPlatform}`);
    }
  }

  static validateClaudeBinary() {
    const claudePath = ClaudeHelper.getClaudeBinaryPath();

    if (!FileIOHelper.fileExists(claudePath)) {
      throw new Error(`Claude Code binary not found at: ${claudePath}`);
    }
  }

  static normalizePathForClaudeProjects(dirPath: string) {
    return dirPath.replace(/\/_/g, '--').replace(/\//g, '-').replace(/_/g, '-');
  }

  static isUserMessage(messageSource: MessageSource) {
    return messageSource === MessageSource.USER;
  }

  static isCCMessage(messageSource: MessageSource) {
    return messageSource === MessageSource.CC;
  }

  static isCompactionSession(lines: string[]) {
    try {
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (ClaudeHelper.isUserMessage(parsed.type)) {
            const messageContent = parsed.message?.content;

            let textContent = '';
            if (typeof messageContent === 'string') {
              textContent = messageContent;
            } else if (Array.isArray(messageContent)) {
              const textPart = messageContent.find((item: { type: string; text?: string }) => item.type === 'text');
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

  static executePromptNonInteractively(prompt: string) {
    ClaudeHelper.validateClaudeBinary();

    const claudePath = ClaudeHelper.getClaudeBinaryPath();

    return new Promise<void>((resolve, reject) => {
      const child = NodeChildProcessHelper.spawn(claudePath, ['--dangerously-skip-permissions', '-p', prompt], {
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
