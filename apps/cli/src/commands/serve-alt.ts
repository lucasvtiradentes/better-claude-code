import { spawn } from 'child_process';
import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCommand } from '../definitions/commands.js';
import { CommandNames } from '../definitions/types.js';
import { handleCommandError } from '../utils/error-handler.js';
import { Logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ServeAltOptions = {
  port?: number;
};

const getRepoRoot = () => {
  let current = __dirname;
  while (current !== '/') {
    if (path.basename(current) === 'apps' && path.basename(path.dirname(current)) !== 'apps') {
      return path.dirname(current);
    }
    current = path.dirname(current);
  }
  throw new Error('Could not find repository root');
};

const isDevMode = () => {
  return process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
};

export function createServeAltCommand(): Command {
  const schema = getCommand(CommandNames.SERVE);

  if (!schema) {
    throw new Error(`Command "${CommandNames.SERVE}" not found in schema`);
  }

  const command = new Command('serve-alt');
  command.description('Start React-based session viewer (alternative implementation)');

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

  const serveAltCommand = async (options: ServeAltOptions) => {
    const port = options.port || 3000;

    if (isDevMode()) {
      Logger.info('Starting in development mode...');
      Logger.info('Backend: http://localhost:3001');
      Logger.info('Frontend: http://localhost:5173');
      Logger.info('Press Ctrl+C to stop');
      Logger.info('');

      const repoRoot = getRepoRoot();

      const backend = spawn('pnpm', ['--filter', '@bcc/backend', 'dev'], {
        cwd: repoRoot,
        stdio: 'inherit',
        env: { ...process.env, PORT: '3001' }
      });

      const frontend = spawn('pnpm', ['--filter', '@bcc/frontend', 'dev'], {
        cwd: repoRoot,
        stdio: 'inherit'
      });

      const cleanup = () => {
        Logger.info('');
        Logger.info('Shutting down servers...');
        backend.kill();
        frontend.kill();
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      await new Promise(() => {});
    } else {
      const repoRoot = getRepoRoot();
      const frontendDist = path.join(repoRoot, 'apps', 'frontend', 'dist');

      try {
        await fs.access(frontendDist);
      } catch {
        Logger.error('Frontend not built. Run: pnpm build:frontend');
        process.exit(1);
      }

      Logger.info(`Starting server on http://localhost:${port}`);
      Logger.info('Press Ctrl+C to stop');
      Logger.info('');

      const { startServer } = await import('@bcc/backend');

      const server = startServer({
        port,
        staticPath: frontendDist
      });

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
    }
  };

  const wrappedAction = async (options: ServeAltOptions) => {
    try {
      await serveAltCommand(options);
    } catch (error) {
      handleCommandError('Failed to start server')(error);
    }
  };

  command.action(wrappedAction);

  return command;
}
