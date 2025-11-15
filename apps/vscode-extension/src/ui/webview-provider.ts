import * as path from 'path';
import * as vscode from 'vscode';
import type { SessionListItem } from '../types.js';
import { logger } from '../utils/logger.js';
import type { SessionProvider } from './session-provider.js';

export class WebviewProvider {
  private static currentPanel: vscode.WebviewPanel | undefined;

  static async showSessionConversation(
    context: vscode.ExtensionContext,
    session: SessionListItem,
    sessionProvider: SessionProvider
  ): Promise<void> {
    try {
      const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

      if (WebviewProvider.currentPanel) {
        WebviewProvider.currentPanel.reveal(column);
        WebviewProvider.currentPanel.title = `Session: ${session.shortId}`;
      } else {
        WebviewProvider.currentPanel = vscode.window.createWebviewPanel(
          'bccSessionConversation',
          `Session: ${session.shortId}`,
          column || vscode.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'out', 'webview'))]
          }
        );

        WebviewProvider.currentPanel.onDidDispose(() => {
          WebviewProvider.currentPanel = undefined;
        });

        WebviewProvider.currentPanel.webview.onDidReceiveMessage(
          async (message) => {
            if (message.type === 'ready') {
              const conversation = await sessionProvider.getSessionConversation(session);
              WebviewProvider.currentPanel?.webview.postMessage({
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
                  conversation
                }
              });
            }
          },
          undefined,
          context.subscriptions
        );
      }

      WebviewProvider.currentPanel.webview.html = WebviewProvider.getHtmlContent(
        context,
        WebviewProvider.currentPanel.webview
      );
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
