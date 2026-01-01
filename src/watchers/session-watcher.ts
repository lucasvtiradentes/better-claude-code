import { logger } from '../common/utils/logger';
import { VscodeHelper } from '../common/vscode/vscode-helper';
import type { Disposable } from '../common/vscode/vscode-types';

export type RefreshCallback = () => void | Promise<void>;

type SessionWatcherCallbacks = {
  onRefresh: RefreshCallback;
};

export function createSessionWatcher(callbacks: SessionWatcherCallbacks): Disposable {
  const watcher = VscodeHelper.createFileSystemWatcher('**/*.jsonl');

  watcher.onDidCreate(async () => {
    logger.info('New session file detected, refreshing...');
    await callbacks.onRefresh();
  });

  watcher.onDidChange(async () => {
    logger.info('Session file changed, refreshing...');
    await callbacks.onRefresh();
  });

  watcher.onDidDelete(async () => {
    logger.info('Session file deleted, refreshing...');
    await callbacks.onRefresh();
  });

  return watcher;
}
