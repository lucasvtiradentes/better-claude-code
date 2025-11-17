import * as path from 'node:path';
import * as vscode from 'vscode';
import type { SessionListItem } from '../common/types.js';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';

export class WebviewProvider {
  private static panels = new Map<string, vscode.WebviewPanel>();
  private static onPanelChangeCallbacks: Array<() => void> = [];
  private static workspaceState: any = null;

  static setWorkspaceState(workspaceState: any): void {
    WebviewProvider.workspaceState = workspaceState;
  }

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

  private static broadcastFiltersUpdate(filters: any): void {
    logger.info(`[WebviewProvider] Broadcasting filters to ${WebviewProvider.panels.size} open panels`);
    for (const [sessionId, panel] of WebviewProvider.panels) {
      logger.info(`[WebviewProvider] Sending filters update to session ${sessionId}`);
      panel.webview.postMessage({
        type: 'filtersUpdated',
        filters
      });
    }
  }

  static async showSessionConversation(
    context: vscode.ExtensionContext,
    session: SessionListItem,
    sessionProvider: SessionProvider
  ): Promise<void> {
    try {
      const existingPanel = WebviewProvider.panels.get(session.id);
      if (existingPanel) {
        existingPanel.reveal();
        return;
      }

      const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

      const panel = vscode.window.createWebviewPanel(
        'bccSessionConversation',
        `Session: ${session.shortId}`,
        column || vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'out', 'webview'))]
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
          if (message.type === 'ready') {
            logger.info(`[WebviewProvider] Received 'ready' for session ${session.shortId}`);
            const conversation = await sessionProvider.getSessionConversation(session);
            const filters = WebviewProvider.workspaceState?.getMessageFiltersState() || {
              showUserMessages: true,
              showAssistantMessages: true,
              showToolCalls: true
            };
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
                  tokenPercentage: session.tokenPercentage
                },
                conversation,
                filters
              }
            });
          } else if (message.type === 'saveFilters') {
            logger.info(`[WebviewProvider] Received 'saveFilters': ${JSON.stringify(message.filters)}`);
            if (WebviewProvider.workspaceState) {
              WebviewProvider.workspaceState.setMessageFiltersState(message.filters);
              WebviewProvider.broadcastFiltersUpdate(message.filters);
            }
          } else if (message.type === 'openImage') {
            const imageData = message.imageData as string;
            const imageIndex = message.imageIndex as number;

            const imagePanel = vscode.window.createWebviewPanel(
              'imagePreview',
              `Image #${imageIndex}`,
              vscode.ViewColumn.Beside,
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
          }
        },
        undefined,
        context.subscriptions
      );

      panel.webview.html = WebviewProvider.getHtmlContent(context, panel.webview);
    } catch (error) {
      logger.error('Failed to show session conversation', error as Error);
      vscode.window.showErrorMessage('Failed to display session conversation');
    }
  }

  private static getHtmlContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
    const scriptPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'out', 'webview', 'index.js'));
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    const stylePathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'out', 'webview', 'index.css'));
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
