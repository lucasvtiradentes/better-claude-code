import { APP_INFO } from '../../config/constants.js';
import { type Command, CommandNames } from '../types.js';

export const helloCommandDefinition: Command = {
  name: CommandNames.HELLO,
  description: 'Print a hello message (template command with flags)',
  flags: [
    {
      name: 'name',
      alias: 'n',
      description: 'Name to greet',
      type: 'string'
    },
    {
      name: 'uppercase',
      alias: 'u',
      description: 'Print message in uppercase',
      type: 'boolean'
    },
    {
      name: 'repeat',
      alias: 'r',
      description: 'Number of times to repeat the message',
      type: 'number'
    }
  ],
  examples: [
    `${APP_INFO.name} hello`,
    `${APP_INFO.name} hello --name John`,
    `${APP_INFO.name} hello -n Alice --uppercase`,
    `${APP_INFO.name} hello --name Bob --repeat 3`
  ]
};
