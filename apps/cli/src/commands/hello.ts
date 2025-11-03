import { Command } from 'commander';

import { getCommand } from '../definitions/commands.js';
import { CommandNames } from '../definitions/types.js';
import { handleCommandError } from '../utils/error-handler.js';
import { Logger } from '../utils/logger.js';

interface HelloOptions {
  name?: string;
  uppercase?: boolean;
  repeat?: number;
}

export function createHelloCommand(): Command {
  const schema = getCommand(CommandNames.HELLO);

  if (!schema) {
    throw new Error(`Command "${CommandNames.HELLO}" not found in schema`);
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

  const helloCommand = async (options: HelloOptions) => {
    const name = options.name || 'World';
    let message = `Hello, ${name}!`;

    if (options.uppercase) {
      message = message.toUpperCase();
    }

    const repeatCount = options.repeat || 1;

    for (let i = 0; i < repeatCount; i++) {
      Logger.success(message);
    }
  };

  const wrappedAction = async (options: HelloOptions) => {
    try {
      await helloCommand(options);
    } catch (error) {
      handleCommandError('Failed to execute hello command')(error);
    }
  };

  command.action(wrappedAction);

  return command;
}
