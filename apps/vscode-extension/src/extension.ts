import { APP_NAME } from '@better-claude-code/shared';
import * as vscode from 'vscode';
import { registerAddLabelCommand } from './commands/add-label.js';
import { registerCompactCommand } from './commands/compact.js';
import { registerFileOperationsCommands } from './commands/file-operations.js';
import { registerFilterCommand } from './commands/filter.js';
import { registerRefreshCommand } from './commands/refresh.js';
import { createShowLogsCommand } from './commands/show-logs.js';
import { registerToggleCollapseCommand } from './commands/toggle-collapse.js';
import { registerViewCompactionCommand } from './commands/view-compaction.js';
import { registerViewDetailsCommand } from './commands/view-details.js';
import { logger } from './common/utils/logger.js';
import { getCurrentWorkspacePath } from './common/utils/workspace-detector.js';
import { WebviewProvider } from './session-view-page/webview-provider.js';
import { SessionProvider } from './sidebar/session-provider.js';
import { StatusBarManager } from './status-bar/status-bar-manager.js';

let sessionProvider: SessionProvider;
let statusBarManager: StatusBarManager;

export async function activate(context: vscode.ExtensionContext) {
  logger.info(`${APP_NAME} extension is now active (built at ${__BUILD_TIMESTAMP__})`);

  const workspacePath = getCurrentWorkspacePath();

  if (!workspacePath) {
    logger.info('No workspace folder is open. Open a folder to view Claude Code sessions.');
    return;
  }

  sessionProvider = new SessionProvider();

  WebviewProvider.onPanelChange(() => {
    sessionProvider.refresh();
  });

  const packageJson = context.extension.packageJSON;
  const viewId =
    packageJson.contributes?.views?.bccExplorer?.[0]?.id ||
    packageJson.contributes?.views?.bccExplorerDev?.[0]?.id ||
    'bccSessionExplorer';

  const treeView = vscode.window.createTreeView(viewId, {
    treeDataProvider: sessionProvider
  });

  statusBarManager = new StatusBarManager(sessionProvider);
  context.subscriptions.push(statusBarManager.getDisposable());

  registerRefreshCommand(context, sessionProvider);
  registerCompactCommand(context, sessionProvider, workspacePath);
  registerViewCompactionCommand(context, workspacePath);
  registerViewDetailsCommand(context, sessionProvider);
  registerFilterCommand(context, sessionProvider);
  registerFileOperationsCommands(context);
  registerAddLabelCommand(context, sessionProvider);
  registerToggleCollapseCommand(context, sessionProvider);

  context.subscriptions.push(createShowLogsCommand());
  context.subscriptions.push(treeView);

  await sessionProvider.initialize(workspacePath);

  statusBarManager.update();

  treeView.onDidChangeVisibility(async () => {
    if (treeView.visible) {
      await sessionProvider.refresh();
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

  logger.info(`${APP_NAME} extension activation complete`);
}

export function deactivate() {
  if (statusBarManager) {
    statusBarManager.dispose();
  }
  logger.info(`${APP_NAME} extension deactivated\n\n`);
}
