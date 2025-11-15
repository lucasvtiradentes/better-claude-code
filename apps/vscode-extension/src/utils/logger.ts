import * as vscode from 'vscode';

class Logger {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Better Claude Code');
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

  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
  }

  show(): void {
    this.outputChannel.show();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}

export const logger = new Logger();
