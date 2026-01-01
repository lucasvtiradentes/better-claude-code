import { NodePathHelper } from '@/common/utils/helpers/node-helper';
import type { SessionListItem } from '@/lib/node-utils';
import type { MessageFiltersState } from '../common/schemas/workspace-state.schema';
import { messageFiltersState } from '../common/state';
import { logger } from '../common/utils/logger.js';
import { VscodeConstants } from '../common/vscode/vscode-constants';
import { VscodeHelper } from '../common/vscode/vscode-helper';
import type { ExtensionContext, WebviewPanel } from '../common/vscode/vscode-types';
import type { SessionProvider } from '../sidebar/session-provider.js';

export class WebviewProvider {
  private static panels = new Map<string, WebviewPanel>();
  private static onPanelChangeCallbacks: Array<() => void> = [];

  static onPanelChange(callback: () => void): void {
    WebviewProvider.onPanelChangeCallbacks.push(callback);
  }

  static getOpenSessionIds(): string[] {
    return Array.from(WebviewProvider.panels.keys());
  }

  private static notifyPanelChange(): void {
    for (const callback of WebviewProvider.onPanelChangeCallbacks) {
      callback();
    }
  }

  private static broadcastFiltersUpdate(filters: MessageFiltersState): void {
    logger.info(`[WebviewProvider] Broadcasting filters to ${WebviewProvider.panels.size} open panels`);
    for (const [sessionId, panel] of WebviewProvider.panels) {
      logger.info(`[WebviewProvider] Sending filters update to session ${sessionId}`);
      panel.webview.postMessage({
        type: 'filtersUpdated',
        filters
      });
    }
  }

  static showSessionConversation(
    context: ExtensionContext,
    session: SessionListItem,
    sessionProvider: SessionProvider
  ): void {
    try {
      const existingPanel = WebviewProvider.panels.get(session.id);
      if (existingPanel) {
        existingPanel.reveal();
        return;
      }

      const activeEditor = VscodeHelper.getActiveTextEditor();
      const column = activeEditor ? activeEditor.viewColumn : undefined;

      const panel = VscodeHelper.createWebviewPanel(
        'bccSessionConversation',
        `Session: ${session.shortId}`,
        column || VscodeConstants.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [VscodeHelper.createFileUri(NodePathHelper.join(context.extensionPath, 'out', 'webview'))]
        }
      );

      WebviewProvider.panels.set(session.id, panel);
      WebviewProvider.notifyPanelChange();

      panel.onDidDispose(() => {
        WebviewProvider.panels.delete(session.id);
        WebviewProvider.notifyPanelChange();
      });

      panel.webview.onDidReceiveMessage(
        async (message) => {
          logger.info(`[WebviewProvider] Message received - type: ${message.type}, sessionId: ${session.id}`);
          if (message.type === 'ready') {
            logger.info(`[WebviewProvider] Received 'ready' for session ${session.shortId}`);
            const conversation = await sessionProvider.getSessionConversation(session);
            const filters = messageFiltersState.load();
            logger.info(`[WebviewProvider] Sending filters to webview: ${JSON.stringify(filters)}`);
            panel.webview.postMessage({
              type: 'sessionData',
              data: {
                session: {
                  id: session.id,
                  title: session.title,
                  shortId: session.shortId,
                  createdAt: session.createdAt,
                  messageCount: session.messageCount,
                  tokenPercentage: session.tokenPercentage,
                  compacted: session.hasCompaction
                },
                conversation,
                filters
              }
            });
          } else if (message.type === 'saveFilters') {
            logger.info(`[WebviewProvider] Received 'saveFilters': ${JSON.stringify(message.filters)}`);
            messageFiltersState.save(message.filters);
            WebviewProvider.broadcastFiltersUpdate(message.filters);
          } else if (message.type === 'openImage') {
            const imageData = message.imageData as string;
            const imageIndex = message.imageIndex as number;

            const imagePanel = VscodeHelper.createWebviewPanel(
              'imagePreview',
              `Image #${imageIndex}`,
              VscodeConstants.ViewColumn.Beside,
              {
                enableScripts: false,
                retainContextWhenHidden: false
              }
            );

            imagePanel.webview.html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #1e1e1e;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    img {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <img src="data:image/png;base64,${imageData}" alt="Image #${imageIndex}" />
</body>
</html>`;
          } else if (message.type === 'openRawSession') {
            const sessionPath = sessionProvider.getSessionPath(session.id);
            if (sessionPath) {
              await VscodeHelper.openDocumentByPath(sessionPath, {
                viewColumn: VscodeConstants.ViewColumn.Beside
              });
            }
          } else if (message.type === 'deleteSession') {
            logger.info(`[WebviewProvider] Delete requested for session ${session.shortId} (${session.id})`);
            try {
              const confirmed = await VscodeHelper.showWarningMessage(
                `Delete session ${session.shortId}? This will also delete any compaction files.`,
                { modal: true },
                'Delete'
              );
              logger.info(`[WebviewProvider] User confirmation: ${confirmed}`);

              if (confirmed === 'Delete') {
                logger.info(`[WebviewProvider] Starting deletion of session ${session.id}`);
                await sessionProvider.deleteSession(session.id);
                logger.info(`[WebviewProvider] Session deleted, disposing panel`);
                panel.dispose();
                logger.info(`[WebviewProvider] Panel disposed, refreshing sidebar`);
                await sessionProvider.refresh();
                logger.info(`[WebviewProvider] Sidebar refreshed`);
                VscodeHelper.showInformationMessageSimple(`Session ${session.shortId} deleted successfully`);
              }
            } catch (error) {
              logger.error(`[WebviewProvider] Delete session error: ${(error as Error).message}`, error as Error);
              VscodeHelper.showErrorMessageSimple(`Failed to delete session: ${(error as Error).message}`);
            }
          } else if (message.type === 'compactSession') {
            try {
              const summaryPath = await VscodeHelper.withProgress(
                {
                  location: VscodeConstants.ProgressLocation.Notification,
                  title: `Compacting session ${session.shortId}...`,
                  cancellable: false
                },
                () => {
                  return sessionProvider.compactSession(session.id);
                }
              );

              VscodeHelper.showInformationMessageSimple(`Session ${session.shortId} compacted successfully`);

              await VscodeHelper.openDocumentByPath(summaryPath, {
                viewColumn: VscodeConstants.ViewColumn.Beside
              });

              await sessionProvider.refresh();
            } catch (error) {
              logger.error('Failed to compact session', error as Error);
              VscodeHelper.showErrorMessageSimple(`Failed to compact session: ${(error as Error).message}`);
            }
          } else if (message.type === 'openParsed') {
            const parsedPath = await sessionProvider.getParsedSessionPath(session.id);
            if (parsedPath) {
              await VscodeHelper.openDocumentByPath(parsedPath, {
                viewColumn: VscodeConstants.ViewColumn.Beside
              });
            } else {
              VscodeHelper.showWarningMessageSimple('Parsed session file not found');
            }
          } else if (message.type === 'openSummary') {
            const summaryPath = await sessionProvider.getSummaryPath(session.id);
            if (summaryPath) {
              await VscodeHelper.openDocumentByPath(summaryPath, {
                viewColumn: VscodeConstants.ViewColumn.Beside
              });
            } else {
              VscodeHelper.showWarningMessageSimple('Summary file not found');
            }
          }
        },
        undefined,
        context.subscriptions
      );

      panel.webview.html = WebviewProvider.getHtmlContent(context, panel.webview);
    } catch (error) {
      logger.error('Failed to show session conversation', error as Error);
      VscodeHelper.showErrorMessageSimple('Failed to display session conversation');
    }
  }

  private static getHtmlContent(context: ExtensionContext, webview: WebviewPanel['webview']): string {
    const scriptPathOnDisk = VscodeHelper.createFileUri(
      NodePathHelper.join(context.extensionPath, 'out', 'webview', 'index.js')
    );
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    const stylePathOnDisk = VscodeHelper.createFileUri(
      NodePathHelper.join(context.extensionPath, 'out', 'webview', 'index.css')
    );
    const styleUri = webview.asWebviewUri(stylePathOnDisk);

    const cspSource = webview.cspSource;
    const nonce = WebviewProvider.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${cspSource} https: data:;">
  <link rel="stylesheet" href="${styleUri}">
  <title>BCC Session</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private static getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
