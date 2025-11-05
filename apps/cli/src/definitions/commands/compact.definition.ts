import { APP_CLI_NAME } from '@better-claude-code/shared';
import { type Command, CommandNames } from '../types.js';

export const compactCommandDefinition: Command = {
  name: CommandNames.COMPACT,
  description: 'Compact Claude Code sessions into summaries',
  flags: [
    {
      name: 'all',
      alias: 'a',
      description: 'Show all sessions (no limit)',
      type: 'boolean'
    },
    {
      name: 'latest',
      description: 'Compact the most recent session',
      type: 'boolean'
    },
    {
      name: 'id',
      alias: 'i',
      description: 'Compact a specific session by ID',
      type: 'string'
    },
    {
      name: 'last',
      alias: 'l',
      description: 'Use last CC message as title instead of first user message',
      type: 'boolean'
    }
  ],
  examples: [
    `${APP_CLI_NAME} compact`,
    `${APP_CLI_NAME} compact --all`,
    `${APP_CLI_NAME} compact --latest`,
    `${APP_CLI_NAME} compact --id a1b2c3d4-e5f6`,
    `${APP_CLI_NAME} compact --last`
  ]
};
