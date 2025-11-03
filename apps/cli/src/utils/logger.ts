import { colors } from './colors.js';

export class Logger {
  static error(message: string, error?: unknown): void {
    const errorText = error instanceof Error ? error.message : 'Unknown error';
    console.error(colors.red(`❌ ${message}: ${errorText}`));
  }

  static success(message: string): void {
    console.log(colors.green(`✅ ${message}`));
  }

  static warning(message: string): void {
    console.log(colors.yellow(`⚠️  ${message}`));
  }

  static info(message: string): void {
    console.log(`${message}`);
  }

  static dim(message: string): void {
    console.log(colors.dim(message));
  }

  static plain(message: string): void {
    console.log(message);
  }

  static json(data: unknown): void {
    console.log(JSON.stringify(data, null, 2));
  }

  static bold(message: string): void {
    console.log(colors.bold(message));
  }

  static loading(message: string): void {
    console.log(`🔄 ${message}`);
  }

  static link(url: string, prefix?: string): void {
    const linkText = prefix ? `${prefix} ${url}` : url;
    console.log(colors.dim(`🔗 ${linkText}`));
  }
}
