import { readFileSync } from 'node:fs';
import {
  ClaudeHelper,
  compactSession,
  ensureCompactionDirExists,
  getCompactionParsedPath,
  getCompactionSummaryPath,
  getPromptPathForExtension,
  PromptFile,
  parseSessionToMarkdown
} from '@better-claude-code/node-utils';
import { logger } from '../utils/logger.js';

export class CompactService {
  async compactSession(sessionId: string, workspacePath: string): Promise<string> {
    try {
      logger.info(`Compacting session ${sessionId} for workspace ${workspacePath}`);

      const normalizedPath = ClaudeHelper.normalizePathForClaudeProjects(workspacePath);
      const sessionFile = ClaudeHelper.getSessionPath(normalizedPath, sessionId);

      ensureCompactionDirExists(normalizedPath, sessionId);

      const parsedFile = getCompactionParsedPath(normalizedPath, sessionId);
      const summaryFile = getCompactionSummaryPath(normalizedPath, sessionId);

      logger.info('Step 1/2: Parsing session to markdown...');
      await parseSessionToMarkdown(sessionFile, parsedFile, workspacePath);
      logger.info('Parsed session to markdown');

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
