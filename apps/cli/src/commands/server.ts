import { spawn } from 'child_process';
import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getCommand } from '../definitions/commands.js';
import { CommandNames } from '../definitions/types.js';
import { handleCommandError } from '../utils/error-handler.js';
import { Logger } from '../utils/logger.js';
import { getDistPath } from '../utils/paths.js';

interface ServeOptions {
  port?: number;
  start?: boolean;
  stop?: boolean;
  detach?: boolean;
}

const PID_FILE = path.join(os.tmpdir(), 'bcc-server.pid');

function getPidFilePath(): string {
  return PID_FILE;
}

function savePid(pid: number, port: number): void {
  const pidData = JSON.stringify({ pid, port });
  fs.writeFileSync(getPidFilePath(), pidData, 'utf-8');
}

function loadPid(): { pid: number; port: number } | null {
  const pidFilePath = getPidFilePath();
  if (!fs.existsSync(pidFilePath)) {
    return null;
  }

  try {
    const pidData = fs.readFileSync(pidFilePath, 'utf-8');
    return JSON.parse(pidData);
  } catch {
    return null;
  }
}

function removePidFile(): void {
  const pidFilePath = getPidFilePath();
  if (fs.existsSync(pidFilePath)) {
    fs.unlinkSync(pidFilePath);
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function getServerPaths() {
  return {
    backendPath: getDistPath(import.meta.url, 'backend/dist/server.js'),
    frontendPath: getDistPath(import.meta.url, 'frontend/dist')
  };
}

async function startServerForeground(port: number): Promise<void> {
  const paths = getServerPaths();

  if (!fs.existsSync(paths.backendPath)) {
    throw new Error(`Backend not found at ${paths.backendPath}. Run 'pnpm build' first.`);
  }

  if (!fs.existsSync(paths.frontendPath)) {
    throw new Error(`Frontend not found at ${paths.frontendPath}. Run 'pnpm build' first.`);
  }

  Logger.info(`Starting server on http://localhost:${port}`);
  Logger.info('Press Ctrl+C to stop');
  Logger.info('');

  const serverProcess = spawn('node', [paths.backendPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port.toString(),
      STATIC_PATH: paths.frontendPath
    }
  });

  const cleanup = () => {
    Logger.info('');
    Logger.info('Shutting down server...');
    serverProcess.kill();
    Logger.success('Server stopped');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  serverProcess.on('error', (error) => {
    Logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      Logger.error(`Server exited with code ${code}`);
      process.exit(code);
    }
  });

  await new Promise(() => {});
}

async function startServerDetached(port: number): Promise<void> {
  const existingPid = loadPid();
  if (existingPid && isProcessRunning(existingPid.pid)) {
    Logger.warning(`Server is already running on port ${existingPid.port} (PID: ${existingPid.pid})`);
    Logger.info('Use --stop to stop the server first');
    return;
  }

  const paths = getServerPaths();

  if (!fs.existsSync(paths.backendPath)) {
    throw new Error(`Backend not found at ${paths.backendPath}. Run 'pnpm build' first.`);
  }

  if (!fs.existsSync(paths.frontendPath)) {
    throw new Error(`Frontend not found at ${paths.frontendPath}. Run 'pnpm build' first.`);
  }

  const logFile = path.join(os.tmpdir(), 'bcc-server.log');
  const out = fs.openSync(logFile, 'a');
  const err = fs.openSync(logFile, 'a');

  const serverProcess = spawn('node', [paths.backendPath], {
    detached: true,
    stdio: ['ignore', out, err],
    env: {
      ...process.env,
      PORT: port.toString(),
      STATIC_PATH: paths.frontendPath
    }
  });

  serverProcess.unref();

  savePid(serverProcess.pid as number, port);

  Logger.success(`Server started in detached mode (PID: ${serverProcess.pid})`);
  Logger.info(`Server running on http://localhost:${port}`);
  Logger.info(`Logs: ${logFile}`);
  Logger.info('Use --stop to stop the server');
}

async function stopServer(): Promise<void> {
  const pidData = loadPid();

  if (!pidData) {
    Logger.warning('No running server found');
    return;
  }

  if (!isProcessRunning(pidData.pid)) {
    Logger.warning(`Server process (PID: ${pidData.pid}) is not running`);
    removePidFile();
    return;
  }

  try {
    process.kill(pidData.pid, 'SIGTERM');
    Logger.success(`Server stopped (PID: ${pidData.pid})`);
    removePidFile();
  } catch (error) {
    Logger.error(`Failed to stop server: ${(error as Error).message}`);
    throw error;
  }
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
