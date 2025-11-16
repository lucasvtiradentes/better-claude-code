import { existsSync, openSync } from 'node:fs';
import { BackendEnvSchema, NodeEnv } from '@better-claude-code/node-utils';
import { BACKEND_PORT, createLocalHostLink } from '@better-claude-code/shared';
import { spawn } from 'child_process';
import { ENV } from '../../env.js';
import { Logger } from '../../utils/logger.js';
import { getDistPath } from '../../utils/paths.js';
import { isProcessRunning, LOG_FILE, loadPid, savePid } from './utils.js';

function getServerInfo() {
  const frontendPath = getDistPath(import.meta.url, 'frontend');

  const backendEnv: BackendEnvSchema = {
    ...process.env,
    NODE_ENV: ENV.NODE_ENV as NodeEnv,
    SERVER_PORT: BACKEND_PORT,
    FRONTEND_STATIC_PATH: frontendPath
  };

  return {
    backendPath: getDistPath(import.meta.url, 'backend', 'src', 'main.js'),
    frontendPath,
    backendEnv: backendEnv as unknown as Record<keyof BackendEnvSchema, string>
  };
}

export async function startServerForeground(port: number) {
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
    env: serverInfo.backendEnv
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

export async function startServerDetached(port: number) {
  const existingPid = loadPid();
  if (existingPid && isProcessRunning(existingPid.pid)) {
    Logger.warning(`Server is already running on port ${existingPid.port} (PID: ${existingPid.pid})`);
    Logger.info('Use --stop to stop the server first');
    return;
  }

  const serverInfo = getServerInfo();

  if (!existsSync(serverInfo.backendPath)) {
    throw new Error(`Backend not found at ${serverInfo.backendPath}. Run 'pnpm build' first.`);
  }

  if (!existsSync(serverInfo.frontendPath)) {
    throw new Error(`Frontend not found at ${serverInfo.frontendPath}. Run 'pnpm build' first.`);
  }

  const out = openSync(LOG_FILE, 'a');
  const err = openSync(LOG_FILE, 'a');

  const serverProcess = spawn('node', [serverInfo.backendPath], {
    detached: true,
    stdio: ['ignore', out, err],
    env: serverInfo.backendEnv
  });

  serverProcess.unref();

  savePid(serverProcess.pid as number, port);

  Logger.success(`Server started in detached mode (PID: ${serverProcess.pid})`);
  Logger.info(`Server running on ${createLocalHostLink(port)}`);
  Logger.info(`Logs: ${LOG_FILE}`);
  Logger.info('Use --stop to stop the server');
}
