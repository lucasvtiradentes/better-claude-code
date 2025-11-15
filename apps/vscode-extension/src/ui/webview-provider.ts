import * as vscode from 'vscode';
import type { SessionListItem } from '../types.js';
import { logger } from '../utils/logger.js';

export class WebviewProvider {
  private static currentPanel: vscode.WebviewPanel | undefined;

  static showSessionDetails(context: vscode.ExtensionContext, session: SessionListItem): void {
    try {
      const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

      if (WebviewProvider.currentPanel) {
        WebviewProvider.currentPanel.reveal(column);
        WebviewProvider.currentPanel.webview.html = WebviewProvider.getHtmlContent(session);
      } else {
        WebviewProvider.currentPanel = vscode.window.createWebviewPanel(
          'bccSessionDetails',
          `Session: ${session.shortId}`,
          column || vscode.ViewColumn.One,
          {
            enableScripts: true
          }
        );

        WebviewProvider.currentPanel.webview.html = WebviewProvider.getHtmlContent(session);

        WebviewProvider.currentPanel.onDidDispose(() => {
          WebviewProvider.currentPanel = undefined;
        });
      }
    } catch (error) {
      logger.error('Failed to show session details', error as Error);
      vscode.window.showErrorMessage('Failed to display session details');
    }
  }

  private static getHtmlContent(session: SessionListItem): string {
    const createdDate = new Date(session.createdAt).toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Details</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1 {
            color: var(--vscode-foreground);
            margin-top: 0;
        }
        .section {
            margin-bottom: 20px;
        }
        .label {
            font-weight: bold;
            color: var(--vscode-descriptionForeground);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            padding: 15px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .stat-label {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        .summary {
            padding: 15px;
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            margin: 10px 0;
            white-space: pre-wrap;
        }
        .file-path {
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>${session.title}</h1>

    <div class="section">
        <span class="label">Session ID:</span> <span class="file-path">${session.id}</span>
    </div>

    <div class="section">
        <span class="label">Created:</span> ${createdDate}
    </div>

    ${
      session.filePath
        ? `<div class="section">
        <span class="label">File Path:</span> <span class="file-path">${session.filePath}</span>
    </div>`
        : ''
    }

    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${session.messageCount}</div>
            <div class="stat-label">Total Messages</div>
        </div>

        ${
          session.userMessageCount !== undefined
            ? `<div class="stat-card">
            <div class="stat-value">${session.userMessageCount}</div>
            <div class="stat-label">User Messages</div>
        </div>`
            : ''
        }

        ${
          session.assistantMessageCount !== undefined
            ? `<div class="stat-card">
            <div class="stat-value">${session.assistantMessageCount}</div>
            <div class="stat-label">Assistant Messages</div>
        </div>`
            : ''
        }

        ${
          session.tokenPercentage
            ? `<div class="stat-card">
            <div class="stat-value">${session.tokenPercentage}%</div>
            <div class="stat-label">Token Usage</div>
        </div>`
            : ''
        }

        ${
          session.imageCount
            ? `<div class="stat-card">
            <div class="stat-value">${session.imageCount}</div>
            <div class="stat-label">Images</div>
        </div>`
            : ''
        }

        ${
          session.customCommandCount
            ? `<div class="stat-card">
            <div class="stat-value">${session.customCommandCount}</div>
            <div class="stat-label">Custom Commands</div>
        </div>`
            : ''
        }

        ${
          session.filesOrFoldersCount
            ? `<div class="stat-card">
            <div class="stat-value">${session.filesOrFoldersCount}</div>
            <div class="stat-label">Files/Folders Referenced</div>
        </div>`
            : ''
        }

        ${
          session.urlCount
            ? `<div class="stat-card">
            <div class="stat-value">${session.urlCount}</div>
            <div class="stat-label">URLs</div>
        </div>`
            : ''
        }
    </div>

    ${
      session.summary
        ? `<div class="section">
        <div class="label">Summary:</div>
        <div class="summary">${session.summary}</div>
    </div>`
        : ''
    }

    ${
      session.labels && session.labels.length > 0
        ? `<div class="section">
        <div class="label">Labels:</div>
        <div>${session.labels.join(', ')}</div>
    </div>`
        : ''
    }
</body>
</html>`;
  }
}
