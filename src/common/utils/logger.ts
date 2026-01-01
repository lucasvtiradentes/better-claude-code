import { APP_NAME, BCC_EXTENSION_LOG_FILE } from '@/common/utils';
import { VscodeHelper } from '../vscode/vscode-helper';
import type { OutputChannel } from '../vscode/vscode-types';
import { FileIOHelper } from './helpers/node-helper';

export const LOG_FILE_PATH = BCC_EXTENSION_LOG_FILE;

class Logger {
  private outputChannel: OutputChannel;

  constructor() {
    this.outputChannel = VscodeHelper.createOutputChannel(APP_NAME);
  }

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

    this.outputChannel.appendLine(logMessage);

    try {
      FileIOHelper.appendFile(LOG_FILE_PATH, `${logMessage}\n`);
    } catch {}
  }

  show(): void {
    this.outputChannel.show();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}

export const logger = new Logger();
