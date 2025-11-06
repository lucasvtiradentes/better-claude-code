import { colors } from './colors.js';

export class Logger {
  static error(message: string, error?: unknown) {
    const errorText = error instanceof Error ? error.message : 'Unknown error';
    console.error(colors.red(`❌ ${message}: ${errorText}`));
  }

  static success(message: string) {
    console.log(colors.green(`✅ ${message}`));
  }

  static warning(message: string) {
    console.log(colors.yellow(`⚠️  ${message}`));
  }

  static info(message: string) {
    console.log(`${message}`);
  }

  static dim(message: string) {
    console.log(colors.dim(message));
  }

  static plain(message: string) {
    console.log(message);
  }

  static json(data: unknown) {
    console.log(JSON.stringify(data, null, 2));
  }

  static bold(message: string) {
    console.log(colors.bold(message));
  }

  static loading(message: string) {
    console.log(`🔄 ${message}`);
  }

  static link(url: string, prefix?: string) {
    const linkText = prefix ? `${prefix} ${url}` : url;
    console.log(colors.dim(`🔗 ${linkText}`));
  }
}
