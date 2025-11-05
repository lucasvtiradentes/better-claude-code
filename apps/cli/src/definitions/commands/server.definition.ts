import { APP_CLI_NAME } from '@better-claude-code/shared';
import { type Command, CommandNames } from '../types.js';

export const serverCommandDefinition: Command = {
  name: CommandNames.SERVER,
  description: 'Start web server to view Claude Code sessions',
  flags: [
    {
      name: 'port',
      alias: 'p',
      description: 'Port to run the server on',
      type: 'number'
    },
    {
      name: 'start',
      alias: 's',
      description: 'Start the server',
      type: 'boolean'
    },
    {
      name: 'stop',
      description: 'Stop the detached server',
      type: 'boolean'
    },
    {
      name: 'detach',
      alias: 'd',
      description: 'Run server in detached mode',
      type: 'boolean'
    }
  ],
  examples: [
    `${APP_CLI_NAME} server --start`,
    `${APP_CLI_NAME} server -s -p 8080`,
    `${APP_CLI_NAME} server --start --detach`,
    `${APP_CLI_NAME} server -s -d`,
    `${APP_CLI_NAME} server --stop`
  ]
};
