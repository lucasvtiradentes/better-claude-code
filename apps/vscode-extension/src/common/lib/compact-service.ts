import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ClaudeHelper,
  compactSession,
  getPromptPathForExtension,
  PromptFile,
  parseSessionToMarkdown
} from '@better-claude-code/node-utils';
import { logger } from '../utils/logger.js';

export class CompactService {
  async compactSession(sessionId: string, workspacePath: string): Promise<string> {
    try {
      logger.info(`Compacting session ${sessionId} for workspace ${workspacePath}`);

      const shortId = sessionId.slice(0, 12);
      const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(workspacePath);
      const sessionFile = ClaudeHelper.getSessionPath(normalizedPath, sessionId);
      const parsedFile = join(workspacePath, `cc-session-parsed-${shortId}.md`);
      const summaryFile = join(workspacePath, `cc-session-summary-${shortId}.md`);

      logger.info('Step 1/2: Parsing session to markdown...');
      await parseSessionToMarkdown(sessionFile, parsedFile, workspacePath);
      logger.info(`Parsed to: ${parsedFile}`);

      logger.info('Step 2/2: Compacting via Claude Code...');
      const promptTemplatePath = getPromptPathForExtension(PromptFile.SESSION_COMPACTION);
      const promptTemplate = readFileSync(promptTemplatePath, 'utf-8');
      await compactSession(parsedFile, summaryFile, promptTemplate, workspacePath);
      logger.info(`Summary saved to: ${summaryFile}`);

      return summaryFile;
    } catch (error) {
      logger.error('Failed to compact session', error as Error);
      throw error;
    }
  }
}
