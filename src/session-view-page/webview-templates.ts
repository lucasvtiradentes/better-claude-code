import { NodePathHelper } from '../common/utils/helpers/node-helper';
import { VscodeHelper } from '../common/vscode/vscode-helper';
import type { ExtensionContext, Uri, WebviewPanel } from '../common/vscode/vscode-types';

function generateNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

type SessionPanelTemplateParams = {
  scriptUri: Uri;
  styleUri: Uri;
  cspSource: string;
  nonce: string;
};

function buildSessionPanelHtml(params: SessionPanelTemplateParams): string {
  const { scriptUri, styleUri, cspSource, nonce } = params;
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

export function getSessionPanelHtml(context: ExtensionContext, webview: WebviewPanel['webview']): string {
  const scriptPathOnDisk = VscodeHelper.createFileUri(
    NodePathHelper.join(context.extensionPath, 'out', 'webview', 'index.js')
  );
  const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

  const stylePathOnDisk = VscodeHelper.createFileUri(
    NodePathHelper.join(context.extensionPath, 'out', 'webview', 'index.css')
  );
  const styleUri = webview.asWebviewUri(stylePathOnDisk);

  return buildSessionPanelHtml({
    scriptUri,
    styleUri,
    cspSource: webview.cspSource,
    nonce: generateNonce()
  });
}

export function getImagePreviewHtml(imageData: string, imageIndex: number): string {
  return `<!DOCTYPE html>
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
