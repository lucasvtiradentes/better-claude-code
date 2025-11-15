import * as vscode from 'vscode';
import { registerAddLabelCommand } from './commands/add-label.js';
import { registerCompactCommand } from './commands/compact.js';
import { registerFileOperationsCommands } from './commands/file-operations.js';
import { registerFilterCommand } from './commands/filter.js';
import { registerRefreshCommand } from './commands/refresh.js';
import { createShowLogsCommand } from './commands/show-logs.js';
import { registerViewDetailsCommand } from './commands/view-details.js';
import { logger } from './common/utils/logger.js';
import { getCurrentWorkspacePath } from './common/utils/workspace-detector.js';
import { SessionProvider } from './sidebar/session-provider.js';
import { StatusBarManager } from './status-bar/status-bar-manager.js';

let statusBarManager: StatusBarManager;
let sessionProvider: SessionProvider;

export async function activate(context: vscode.ExtensionContext) {
  logger.info('Better Claude Code extension is now active');

  const workspacePath = getCurrentWorkspacePath();

  if (!workspacePath) {
    logger.info('No workspace folder is open. Open a folder to view Claude Code sessions.');
    return;
  }

  sessionProvider = new SessionProvider();

  const treeView = vscode.window.createTreeView('bccSessionExplorer', {
    treeDataProvider: sessionProvider,
    showCollapseAll: true
  });

  statusBarManager = new StatusBarManager(sessionProvider);
  context.subscriptions.push(statusBarManager.getDisposable());

  registerRefreshCommand(context, sessionProvider);
  registerCompactCommand(context, sessionProvider, workspacePath);
  registerViewDetailsCommand(context, sessionProvider);
  registerFilterCommand(context, sessionProvider);
  registerFileOperationsCommands(context);
  registerAddLabelCommand(context, sessionProvider);

  context.subscriptions.push(createShowLogsCommand());
  context.subscriptions.push(treeView);

  await sessionProvider.initialize(workspacePath);

  statusBarManager.update();

  treeView.onDidChangeVisibility(() => {
    if (treeView.visible) {
      statusBarManager.update();
    }
  });

  const watcher = vscode.workspace.createFileSystemWatcher('**/*.jsonl');

  watcher.onDidCreate(async () => {
    logger.info('New session file detected, refreshing...');
    await sessionProvider.refresh();
    statusBarManager.update();
  });

  watcher.onDidChange(async () => {
    logger.info('Session file changed, refreshing...');
    await sessionProvider.refresh();
    statusBarManager.update();
  });

  watcher.onDidDelete(async () => {
    logger.info('Session file deleted, refreshing...');
    await sessionProvider.refresh();
    statusBarManager.update();
  });

  context.subscriptions.push(watcher);

  logger.info('Better Claude Code extension activation complete');
}

export function deactivate() {
  if (statusBarManager) {
    statusBarManager.dispose();
  }
  logger.info('Better Claude Code extension deactivated');
}
