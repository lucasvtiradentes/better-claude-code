import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

export class CompactService {
  async compactSession(sessionId: string, workspacePath: string): Promise<string> {
    try {
      logger.info(`Compacting session ${sessionId} for workspace ${workspacePath}`);

      const command = `cd "${workspacePath}" && claude-code compact --session-id ${sessionId}`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024
      });

      if (stderr) {
        logger.error(`Compact stderr: ${stderr}`);
      }

      if (stdout) {
        logger.info(`Compact stdout: ${stdout}`);
      }

      return stdout.trim();
    } catch (error) {
      logger.error('Failed to compact session', error as Error);
      throw error;
    }
  }
}
