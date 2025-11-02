import { APP_INFO } from '../../config/constants.js';
import { type Command, CommandNames } from '../types.js';

export const serveCommandDefinition: Command = {
  name: CommandNames.SERVE,
  description: 'Start web server to view Claude Code sessions',
  flags: [
    {
      name: 'port',
      alias: 'p',
      description: 'Port to run the server on',
      type: 'number'
    }
  ],
  examples: [`${APP_INFO.name} serve`, `${APP_INFO.name} serve --port 8080`]
};
