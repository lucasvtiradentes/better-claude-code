import { Command } from 'commander';
import { join } from 'path';

import { getCommand } from '../definitions/commands.js';
import { CommandNames } from '../definitions/types.js';
import { validateOS } from '../utils/compact/os-checker.js';
import { compactSession } from '../utils/compact/session-compactor.js';
import { findSessionById, findSessions } from '../utils/compact/session-finder.js';
import { parseSessionToMarkdown } from '../utils/compact/session-parser.js';
import { displaySessions, selectSession } from '../utils/compact/session-selector.js';
import { handleCommandError } from '../utils/error-handler.js';
import { getGitRepoRoot } from '../utils/git.js';
import { Logger } from '../utils/logger.js';

interface CompactOptions {
  all?: boolean;
  latest?: boolean;
  id?: string;
  last?: boolean;
}

export function createCompactCommand(): Command {
  const schema = getCommand(CommandNames.COMPACT);

  if (!schema) {
    throw new Error(`Command "${CommandNames.COMPACT}" not found in schema`);
  }

  const command = new Command(schema.name);
  command.description(schema.description);

  if (schema.flags) {
    for (const flag of schema.flags) {
      let flagString = `--${flag.name}`;

      if (flag.alias) {
        flagString = `-${flag.alias}, ${flagString}`;
      }

      if (flag.type === 'string') {
        flagString += ' <value>';
      } else if (flag.type === 'number') {
        flagString += ' <number>';
      }

      command.option(flagString, flag.description);
    }
  }

  const compactCommand = async (options: CompactOptions) => {
    validateOS();

    let currentDir: string;
    try {
      currentDir = await getGitRepoRoot();
    } catch {
      currentDir = process.cwd();
    }

    if (options.id) {
      await compactById(options.id, currentDir);
    } else if (options.latest) {
      await compactLatest(currentDir, options.last);
    } else {
      const limit = options.all ? undefined : 20;
      await compactInteractive(limit, currentDir, options.last);
    }
  };

  const wrappedAction = async (options: CompactOptions) => {
    try {
      await compactCommand(options);
    } catch (error) {
      handleCommandError('Failed to compact session')(error);
    }
  };

  command.action(wrappedAction);

  return command;
}

async function compactById(sessionId: string, repoRoot: string): Promise<void> {
  Logger.loading(`Finding session ${sessionId}...`);

  const session = await findSessionById(sessionId);

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  Logger.info(`Found session: ${session.shortId}`);
  Logger.info(`  User messages: ${session.userCount}`);
  Logger.info(`  CC messages: ${session.assistantCount}`);
  Logger.info('');

  await performCompaction(session.id, session.file, repoRoot);
}

async function compactLatest(repoRoot: string, useLastMessage?: boolean): Promise<void> {
  Logger.loading('Finding latest session...');

  const sessions = await findSessions(1, useLastMessage);

  if (sessions.length === 0) {
    throw new Error('No sessions found');
  }

  const session = sessions[0];

  Logger.info(`Latest session: ${session.shortId}`);
  Logger.info(`  Title: ${session.title}`);
  Logger.info(`  User messages: ${session.userCount}`);
  Logger.info(`  CC messages: ${session.assistantCount}`);
  Logger.info('');

  await performCompaction(session.id, session.file, repoRoot);
}

async function compactInteractive(limit: number | undefined, repoRoot: string, useLastMessage?: boolean): Promise<void> {
  Logger.loading('Finding sessions...');

  const sessions = await findSessions(limit, useLastMessage);

  if (sessions.length === 0) {
    throw new Error('No sessions found');
  }

  displaySessions(sessions);

  const selectedSession = await selectSession(sessions);

  if (!selectedSession) {
    Logger.info('Cancelled');
    return;
  }

  Logger.info('');
  Logger.info(`Selected session: ${selectedSession.shortId}`);
  Logger.info(`  Title: ${selectedSession.title}`);
  Logger.info(`  User messages: ${selectedSession.userCount}`);
  Logger.info(`  CC messages: ${selectedSession.assistantCount}`);
  Logger.info('');

  await performCompaction(selectedSession.id, selectedSession.file, repoRoot);
}

async function performCompaction(sessionId: string, sessionFile: string, repoRoot: string): Promise<void> {
  const shortId = sessionId.slice(0, 12);
  const parsedFile = join(repoRoot, `cc-session-parsed-${shortId}.md`);
  const summaryFile = join(repoRoot, `cc-session-summary-${shortId}.md`);

  Logger.loading('Step 1/2: Parsing session to markdown...');
  await parseSessionToMarkdown(sessionFile, parsedFile);
  Logger.success(`Parsed to: ${parsedFile}`);

  Logger.info('');
  Logger.loading('Step 2/2: Compacting via Claude Code...');
  await compactSession(parsedFile, summaryFile);
  Logger.success(`Summary saved to: ${summaryFile}`);

  Logger.info('');
  Logger.success('Compaction complete!');
}
