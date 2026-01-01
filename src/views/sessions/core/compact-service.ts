import { logger } from '../../../common/lib/logger';
import {
  ClaudeHelper,
  ensureCompactionDirExists,
  FileIOHelper,
  getCompactionParsedPath,
  getCompactionSummaryPath,
  getPromptPathForExtension,
  PromptFile
} from '../../../common/utils';
import { compactSession, parseSessionToMarkdown } from './session-compact';

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
      const promptTemplate = FileIOHelper.readFile(promptTemplatePath);
      await compactSession(parsedFile, summaryFile, promptTemplate, workspacePath);
      logger.info(`Summary saved to: ${summaryFile}`);

      return summaryFile;
    } catch (error) {
      logger.error('Failed to compact session', error as Error);
      throw error;
    }
  }
}
