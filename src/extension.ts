import * as vscode from 'vscode';
import { ConfigManager } from '@/lib/node-utils';
import { APP_NAME } from '@/lib/shared';
import { registerAllCommands } from './commands/register-all';
import { logger } from './common/utils/logger.js';
import { getCurrentWorkspacePath } from './common/utils/workspace-detector.js';
import { WebviewProvider } from './session-view-page/webview-provider.js';
import { SessionProvider } from './sidebar/session-provider.js';
import { DateGroupTreeItem, SessionTreeItem } from './sidebar/tree-items.js';
import { StatusBarManager } from './status-bar/status-bar-manager.js';
import { WorkspaceState } from './storage/workspace-state.js';

let sessionProvider: SessionProvider;
let statusBarManager: StatusBarManager;
let decorationProvider: SessionDecorationProvider;

class SessionDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  constructor(private provider: SessionProvider) {}

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    if (uri.scheme !== 'claude-session') {
      return undefined;
    }

    const sessionId = uri.path;
    const session = this.provider.getSession(sessionId);

    if (!session) {
      return undefined;
    }

    if (session.hasCompaction) {
      return {
        badge: '✓',
        color: new vscode.ThemeColor('charts.green'),
        tooltip: 'Compacted Session'
      };
    }

    return undefined;
  }

  refresh(): void {
    this._onDidChangeFileDecorations.fire(undefined);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  logger.info(`${APP_NAME} extension is now active (built at ${__BUILD_TIMESTAMP__})`);

  new ConfigManager();

  const workspacePath = getCurrentWorkspacePath();

  if (!workspacePath) {
    logger.info('No workspace folder is open. Open a folder to view Claude Code sessions.');
    return;
  }

  const workspaceState = new WorkspaceState(context);

  sessionProvider = new SessionProvider();

  decorationProvider = new SessionDecorationProvider(sessionProvider);
  context.subscriptions.push(vscode.window.registerFileDecorationProvider(decorationProvider));

  WebviewProvider.setWorkspaceState(workspaceState);
  WebviewProvider.onPanelChange(() => {
    sessionProvider.refresh();
    decorationProvider.refresh();
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

  const commands = registerAllCommands({
    context,
    sessionProvider,
    decorationProvider,
    workspacePath
  });
  for (const cmd of commands) {
    context.subscriptions.push(cmd);
  }
  context.subscriptions.push(treeView);

  await sessionProvider.initialize(workspacePath, context);

  statusBarManager.update();

  treeView.onDidChangeVisibility(async () => {
    if (treeView.visible) {
      await sessionProvider.refresh();
      statusBarManager.update();
    }
  });

  treeView.onDidChangeSelection(async (e) => {
    if (e.selection.length === 1) {
      const item = e.selection[0];
      if (item instanceof SessionTreeItem) {
        logger.info(`[TreeView] Single selection detected: ${item.session.shortId}, opening details`);
        await vscode.commands.executeCommand('bcc.viewSessionDetails', item.session);
      }
    } else if (e.selection.length > 1) {
      logger.info(`[TreeView] Multi-selection detected: ${e.selection.length} items selected`);
    }
  });

  treeView.onDidExpandElement((e) => {
    if (e.element instanceof DateGroupTreeItem) {
      sessionProvider.onGroupExpanded(e.element);
    }
  });

  treeView.onDidCollapseElement((e) => {
    if (e.element instanceof DateGroupTreeItem) {
      sessionProvider.onGroupCollapsed(e.element);
    }
  });

  const watcher = vscode.workspace.createFileSystemWatcher('**/*.jsonl');

  watcher.onDidCreate(async () => {
    logger.info('New session file detected, refreshing...');
    await sessionProvider.refresh();
    decorationProvider.refresh();
    statusBarManager.update();
  });

  watcher.onDidChange(async () => {
    logger.info('Session file changed, refreshing...');
    await sessionProvider.refresh();
    decorationProvider.refresh();
    statusBarManager.update();
  });

  watcher.onDidDelete(async () => {
    logger.info('Session file deleted, refreshing...');
    await sessionProvider.refresh();
    decorationProvider.refresh();
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
