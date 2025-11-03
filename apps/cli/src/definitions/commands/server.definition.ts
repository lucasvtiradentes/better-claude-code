import { APP_INFO } from '../../config/constants.js';
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
    `${APP_INFO.name} server --start`,
    `${APP_INFO.name} server -s -p 8080`,
    `${APP_INFO.name} server --start --detach`,
    `${APP_INFO.name} server -s -d`,
    `${APP_INFO.name} server --stop`
  ]
};
