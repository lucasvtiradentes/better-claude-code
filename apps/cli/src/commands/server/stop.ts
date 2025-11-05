import { Logger } from '../../utils/logger.js';
import { isProcessRunning, loadPid, removePidFile } from './utils.js';

export async function stopServer(): Promise<void> {
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
