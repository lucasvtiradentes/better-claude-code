import { Command } from 'commander';
import { getCommand } from '../../definitions/commands.js';
import { CommandNames } from '../../definitions/types.js';
import { handleCommandError } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { startServerDetached, startServerForeground } from './start.js';
import { stopServer } from './stop.js';

interface ServeOptions {
  port?: number;
  start?: boolean;
  stop?: boolean;
  detach?: boolean;
}

export function createServerCommand(): Command {
  const schema = getCommand(CommandNames.SERVER);

  if (!schema) {
    throw new Error(`Command "${CommandNames.SERVER}" not found in schema`);
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

  const serverCommand = async (options: ServeOptions) => {
    if (options.stop) {
      await stopServer();
      return;
    }

    if (!options.start) {
      Logger.error('Please specify --start or --stop');
      Logger.info('Examples:');
      Logger.info('  bcc server --start');
      Logger.info('  bcc server --start --detach');
      Logger.info('  bcc server --stop');
      process.exit(1);
    }

    const port = options.port || 3001;

    if (options.detach) {
      await startServerDetached(port);
    } else {
      await startServerForeground(port);
    }
  };

  const wrappedAction = async (options: ServeOptions) => {
    try {
      await serverCommand(options);
    } catch (error) {
      handleCommandError('Failed to execute server command')(error);
    }
  };

  command.action(wrappedAction);

  return command;
}
