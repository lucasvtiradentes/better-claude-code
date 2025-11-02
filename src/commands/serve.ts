import { Command } from 'commander';
import { getCommand } from '../definitions/commands.js';
import { CommandNames } from '../definitions/types.js';
import { startServer } from '../server/index.js';
import { handleCommandError } from '../utils/error-handler.js';
import { Logger } from '../utils/logger.js';

interface ServeOptions {
  port?: number;
}

export function createServeCommand(): Command {
  const schema = getCommand(CommandNames.SERVE);

  if (!schema) {
    throw new Error(`Command "${CommandNames.SERVE}" not found in schema`);
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

  const serveCommand = async (options: ServeOptions) => {
    const port = options.port || 3000;

    Logger.info(`Starting server on http://localhost:${port}`);
    Logger.info('Press Ctrl+C to stop');
    Logger.info('');

    const server = startServer(port);

    process.on('SIGINT', () => {
      Logger.info('');
      Logger.info('Shutting down server...');
      server.close(() => {
        Logger.success('Server stopped');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      server.close(() => {
        process.exit(0);
      });
    });

    await new Promise(() => {});
  };

  const wrappedAction = async (options: ServeOptions) => {
    try {
      await serveCommand(options);
    } catch (error) {
      handleCommandError('Failed to start server')(error);
    }
  };

  command.action(wrappedAction);

  return command;
}
