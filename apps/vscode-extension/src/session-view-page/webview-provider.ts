import * as path from 'path';
import * as vscode from 'vscode';
import type { SessionListItem } from '../common/types.js';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';

export class WebviewProvider {
  static async showSessionConversation(
    context: vscode.ExtensionContext,
    session: SessionListItem,
    sessionProvider: SessionProvider
  ): Promise<void> {
    try {
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

      panel.webview.onDidReceiveMessage(
        async (message) => {
          if (message.type === 'ready') {
            const conversation = await sessionProvider.getSessionConversation(session);
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
                conversation
              }
            });
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
