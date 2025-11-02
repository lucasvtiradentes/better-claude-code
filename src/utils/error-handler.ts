import { Logger } from './logger.js';

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

export function handleCommandError(baseMessage: string | ((error: unknown) => string)) {
  return (error: unknown) => {
    const errorDetails = formatError(error);
    const prefix = typeof baseMessage === 'function' ? baseMessage(error) : baseMessage;
    const fullMessage = `${prefix}: ${errorDetails}`;
    Logger.error(fullMessage);
    process.exit(1);
  };
}
