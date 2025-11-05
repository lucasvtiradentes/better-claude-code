import { existsSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { BackendEnvSchema, NodeEnv } from '@better-claude-code/node-utils';
import { BACKEND_PORT, createLocalHostLink } from '@better-claude-code/shared';
import { spawn } from 'child_process';
import { Command } from 'commander';
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

const PID_FILE = join(os.tmpdir(), 'bcc-server.pid');

function getPidFilePath(): string {
  return PID_FILE;
}

function savePid(pid: number, port: number): void {
  const pidData = JSON.stringify({ pid, port });
  writeFileSync(getPidFilePath(), pidData, 'utf-8');
}

function loadPid(): { pid: number; port: number } | null {
  const pidFilePath = getPidFilePath();
  if (!existsSync(pidFilePath)) {
    return null;
  }

  try {
    const pidData = readFileSync(pidFilePath, 'utf-8');
    return JSON.parse(pidData);
  } catch {
    return null;
  }
}

function removePidFile(): void {
  const pidFilePath = getPidFilePath();
  if (existsSync(pidFilePath)) {
    unlinkSync(pidFilePath);
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

function getServerInfo() {
  const frontendPath = getDistPath(import.meta.url, 'frontend');

  const backendEnv: BackendEnvSchema = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV as NodeEnv,
    SERVER_PORT: BACKEND_PORT,
    FRONTEND_STATIC_PATH: frontendPath
  };

  return {
    backendPath: getDistPath(import.meta.url, 'backend', 'main.js'),
    frontendPath,
    backendEnv: backendEnv
  };
}

async function startServerForeground(port: number): Promise<void> {
  const serverInfo = getServerInfo();

  if (!existsSync(serverInfo.backendPath)) {
    throw new Error(`Backend not found at ${serverInfo.backendPath}. Run 'pnpm build' first.`);
  }

  if (!existsSync(serverInfo.frontendPath)) {
    throw new Error(`Frontend not found at ${serverInfo.frontendPath}. Run 'pnpm build' first.`);
  }

  Logger.info(`Starting server on ${createLocalHostLink(port)}`);
  Logger.info('Press Ctrl+C to stop');
  Logger.info('');

  const serverProcess = spawn('node', [serverInfo.backendPath], {
    stdio: 'inherit',
    env: serverInfo.backendEnv as unknown as Record<keyof BackendEnvSchema, string>
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

  const paths = getServerInfo();

  if (!existsSync(paths.backendPath)) {
    throw new Error(`Backend not found at ${paths.backendPath}. Run 'pnpm build' first.`);
  }

  if (!existsSync(paths.frontendPath)) {
    throw new Error(`Frontend not found at ${paths.frontendPath}. Run 'pnpm build' first.`);
  }

  const logFile = join(os.tmpdir(), 'bcc-server.log');
  const out = openSync(logFile, 'a');
  const err = openSync(logFile, 'a');

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
  Logger.info(`Server running on ${createLocalHostLink(port)}`);
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
