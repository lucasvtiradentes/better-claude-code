import { appendFileSync } from 'node:fs';
import { BCC_EXTENSION_LOG_FILE } from './monorepo-path-utils.js';

class Logger {
  info(message: string): void {
    this.log('INFO', message);
  }

  error(message: string, error?: Error): void {
    const errorMessage = error ? `${message}: ${error.message}\n${error.stack}` : message;
    this.log('ERROR', errorMessage);
  }

  debug(message: string): void {
    this.log('DEBUG', message);
  }

  warn(message: string): void {
    this.log('WARN', message);
  }

  private log(level: string, message: string): void {
    const now = new Date();
    const utcMinus3 = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const timestamp = utcMinus3.toISOString().replace('Z', '-03:00');
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    console.log(logMessage);

    try {
      appendFileSync(BCC_EXTENSION_LOG_FILE, `${logMessage}\n`);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }
}

export const logger = new Logger();
