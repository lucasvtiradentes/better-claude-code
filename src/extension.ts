import { ConfigManager } from '@/lib/node-utils';
import { APP_NAME } from '@/lib/shared';
import { registerAllCommands } from './commands/register-all';
import { initWorkspaceState } from './common/state';
import { logger } from './common/utils/logger.js';
import { getCurrentWorkspacePath } from './common/utils/workspace-detector.js';
import { Command, getCommandId } from './common/vscode/vscode-commands';
import { VscodeColor } from './common/vscode/vscode-constants';
import { VscodeHelper } from './common/vscode/vscode-helper';
import {
  type Disposable,
  EventEmitterClass,
  type ExtensionContext,
  type FileDecoration,
  type FileDecorationProvider,
  ThemeColorClass,
  type TreeItem,
  type TreeView,
  type Uri
} from './common/vscode/vscode-types';
import { WebviewProvider } from './session-view-page/webview-provider.js';
import { SessionProvider } from './sidebar/session-provider.js';
import { DateGroupTreeItem, SessionTreeItem } from './sidebar/tree-items.js';
import { StatusBarManager } from './status-bar/status-bar-manager.js';

class SessionDecorationProvider implements FileDecorationProvider {
  private _onDidChangeFileDecorations = new EventEmitterClass<Uri | Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  constructor(private provider: SessionProvider) {}

  provideFileDecoration(uri: Uri): FileDecoration | undefined {
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
        color: new ThemeColorClass(VscodeColor.ChartsGreen),
        tooltip: 'Compacted Session'
      };
    }

    return undefined;
  }

  refresh(): void {
    this._onDidChangeFileDecorations.fire(undefined);
  }
}

class ExtensionManager {
  private context!: ExtensionContext;
  private workspacePath!: string;
  private sessionProvider!: SessionProvider;
  private statusBarManager!: StatusBarManager;
  private decorationProvider!: SessionDecorationProvider;
  private treeView!: TreeView<TreeItem>;

  async activate(context: ExtensionContext): Promise<void> {
    logger.info(`${APP_NAME} extension is now active (built at ${__BUILD_TIMESTAMP__})`);

    this.context = context;

    this.initializeCore();

    const workspacePath = getCurrentWorkspacePath();
    if (!workspacePath) {
      logger.info('No workspace folder is open. Open a folder to view Claude Code sessions.');
      return;
    }
    this.workspacePath = workspacePath;

    this.initializeProviders();
    this.initializeTreeView();
    this.initializeStatusBar();
    this.registerCommands();
    this.setupEventListeners();
    this.setupFileWatcher();

    await this.sessionProvider.initialize(this.workspacePath, this.context);
    this.statusBarManager.update();

    logger.info(`${APP_NAME} extension activation complete`);
  }

  deactivate(): void {
    if (this.statusBarManager) {
      this.statusBarManager.dispose();
    }
    logger.info(`${APP_NAME} extension deactivated\n\n`);
  }

  private initializeCore(): void {
    new ConfigManager();
    initWorkspaceState(this.context);
  }

  private initializeProviders(): void {
    this.sessionProvider = new SessionProvider();
    this.decorationProvider = new SessionDecorationProvider(this.sessionProvider);
    this.context.subscriptions.push(VscodeHelper.registerFileDecorationProvider(this.decorationProvider));

    WebviewProvider.onPanelChange(() => {
      this.sessionProvider.refresh();
      this.decorationProvider.refresh();
    });
  }

  private initializeTreeView(): void {
    const packageJson = this.context.extension.packageJSON;
    const viewId =
      packageJson.contributes?.views?.bccExplorer?.[0]?.id ||
      packageJson.contributes?.views?.bccExplorerDev?.[0]?.id ||
      'bccSessionExplorer';

    this.treeView = VscodeHelper.createTreeView<TreeItem>(viewId, {
      treeDataProvider: this.sessionProvider
    });

    this.context.subscriptions.push(this.treeView);
  }

  private initializeStatusBar(): void {
    this.statusBarManager = new StatusBarManager(this.sessionProvider);
    this.context.subscriptions.push(this.statusBarManager.getDisposable() as Disposable);
  }

  private registerCommands(): void {
    const commands = registerAllCommands({
      context: this.context,
      sessionProvider: this.sessionProvider,
      decorationProvider: this.decorationProvider,
      workspacePath: this.workspacePath
    });
    for (const cmd of commands) {
      this.context.subscriptions.push(cmd);
    }
  }

  private setupEventListeners(): void {
    this.treeView.onDidChangeVisibility(async () => {
      if (this.treeView.visible) {
        await this.sessionProvider.refresh();
        this.statusBarManager.update();
      }
    });

    this.treeView.onDidChangeSelection(async (e) => {
      if (e.selection.length === 1) {
        const item = e.selection[0];
        if (item instanceof SessionTreeItem) {
          logger.info(`[TreeView] Single selection detected: ${item.session.shortId}, opening details`);
          await VscodeHelper.executeVscodeCommand(getCommandId(Command.ViewSessionDetails), item.session);
        }
      } else if (e.selection.length > 1) {
        logger.info(`[TreeView] Multi-selection detected: ${e.selection.length} items selected`);
      }
    });

    this.treeView.onDidExpandElement((e) => {
      if (e.element instanceof DateGroupTreeItem) {
        this.sessionProvider.onGroupExpanded(e.element);
      }
    });

    this.treeView.onDidCollapseElement((e) => {
      if (e.element instanceof DateGroupTreeItem) {
        this.sessionProvider.onGroupCollapsed(e.element);
      }
    });
  }

  private setupFileWatcher(): void {
    const watcher = VscodeHelper.createFileSystemWatcher('**/*.jsonl');

    watcher.onDidCreate(async () => {
      logger.info('New session file detected, refreshing...');
      await this.sessionProvider.refresh();
      this.decorationProvider.refresh();
      this.statusBarManager.update();
    });

    watcher.onDidChange(async () => {
      logger.info('Session file changed, refreshing...');
      await this.sessionProvider.refresh();
      this.decorationProvider.refresh();
      this.statusBarManager.update();
    });

    watcher.onDidDelete(async () => {
      logger.info('Session file deleted, refreshing...');
      await this.sessionProvider.refresh();
      this.decorationProvider.refresh();
      this.statusBarManager.update();
    });

    this.context.subscriptions.push(watcher);
  }
}

const extensionManager = new ExtensionManager();

export async function activate(context: ExtensionContext) {
  await extensionManager.activate(context);
}

export function deactivate() {
  extensionManager.deactivate();
}
