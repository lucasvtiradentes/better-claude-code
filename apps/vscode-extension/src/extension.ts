import * as vscode from 'vscode';
import { registerCompactCommand } from './commands/compact.js';
import { registerFileOperationsCommands } from './commands/file-operations.js';
import { registerFilterCommand } from './commands/filter.js';
import { registerRefreshCommand } from './commands/refresh.js';
import { registerViewDetailsCommand } from './commands/view-details.js';
import { SessionProvider } from './ui/session-provider.js';
import { logger } from './utils/logger.js';
import { getCurrentWorkspacePath } from './utils/workspace-detector.js';

let statusBarItem: vscode.StatusBarItem;
let sessionProvider: SessionProvider;

export async function activate(context: vscode.ExtensionContext) {
  logger.info('Better Claude Code extension is now active');

  const workspacePath = getCurrentWorkspacePath();

  if (!workspacePath) {
    vscode.window.showWarningMessage(
      'Better Claude Code: No workspace folder is open. Open a folder to view Claude Code sessions.'
    );
    return;
  }

  sessionProvider = new SessionProvider();

  const treeView = vscode.window.createTreeView('bccSessionExplorer', {
    treeDataProvider: sessionProvider,
    showCollapseAll: true
  });

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'bcc.refreshSessions';
  context.subscriptions.push(statusBarItem);

  registerRefreshCommand(context, sessionProvider);
  registerCompactCommand(context, sessionProvider, workspacePath);
  registerViewDetailsCommand(context);
  registerFilterCommand(context, sessionProvider);
  registerFileOperationsCommands(context);

  context.subscriptions.push(treeView);

  await sessionProvider.initialize(workspacePath);

  updateStatusBar();

  treeView.onDidChangeVisibility(() => {
    if (treeView.visible) {
      updateStatusBar();
    }
  });

  const watcher = vscode.workspace.createFileSystemWatcher('**/*.jsonl');

  watcher.onDidCreate(async () => {
    logger.info('New session file detected, refreshing...');
    await sessionProvider.refresh();
    updateStatusBar();
  });

  watcher.onDidChange(async () => {
    logger.info('Session file changed, refreshing...');
    await sessionProvider.refresh();
    updateStatusBar();
  });

  watcher.onDidDelete(async () => {
    logger.info('Session file deleted, refreshing...');
    await sessionProvider.refresh();
    updateStatusBar();
  });

  context.subscriptions.push(watcher);

  logger.info('Better Claude Code extension activation complete');
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
  logger.info('Better Claude Code extension deactivated');
}

function updateStatusBar() {
  if (!sessionProvider) {
    return;
  }

  const stats = sessionProvider.getStats();

  statusBarItem.text = `$(file-text) BCC: ${stats.totalSessions} sessions`;

  if (stats.todayCount > 0) {
    statusBarItem.text += ` (${stats.todayCount} today)`;
  }

  statusBarItem.tooltip = `Total Sessions: ${stats.totalSessions}\nToday: ${stats.todayCount}\nTotal Token Usage: ${stats.totalTokens}%\n\nClick to refresh`;

  statusBarItem.show();
}
