import { VscodeHelper } from '../vscode/vscode-helper';
import { logger } from './logger.js';

export function getCurrentWorkspacePath(): string | null {
  const workspaceFolders = VscodeHelper.getWorkspaceFolders();

  if (workspaceFolders.length === 0) {
    logger.info('No workspace folder is currently open');
    return null;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;
  logger.info(`Current workspace: ${workspacePath}`);
  return workspacePath;
}
