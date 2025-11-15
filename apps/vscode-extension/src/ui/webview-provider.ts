import * as vscode from 'vscode';
import type { SessionListItem } from '../types.js';
import type { SessionProvider } from './session-provider.js';
import { logger } from '../utils/logger.js';

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
      } else {
        WebviewProvider.currentPanel = vscode.window.createWebviewPanel(
          'bccSessionConversation',
          `Session: ${session.shortId}`,
          column || vscode.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true
          }
        );

        WebviewProvider.currentPanel.onDidDispose(() => {
          WebviewProvider.currentPanel = undefined;
        });
      }

      WebviewProvider.currentPanel.webview.html = '<html><body><h3>Loading conversation...</h3></body></html>';

      const conversation = await sessionProvider.getSessionConversation(session);

      WebviewProvider.currentPanel.webview.html = WebviewProvider.getHtmlContent(session, conversation);
    } catch (error) {
      logger.error('Failed to show session conversation', error as Error);
      vscode.window.showErrorMessage('Failed to display session conversation');
    }
  }

  private static getHtmlContent(session: SessionListItem, conversation: any): string {
    const createdDate = new Date(session.createdAt).toLocaleString();

    const messagesHtml = conversation.messages
      .map((msg: any, idx: number) => {
        const isUser = msg.type.includes('user');
        const role = isUser ? 'User' : 'Assistant';
        const cssClass = isUser ? 'user-message' : 'assistant-message';

        const images = conversation.images
          .filter((img: any) => img.messageId === msg.id)
          .map(
            (img: any) =>
              `<div class="image-container">
								<img src="data:image/png;base64,${img.data}" alt="Image ${img.index}" />
								<span class="image-label">Image ${img.index}</span>
							</div>`
          )
          .join('');

        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let formattedContent = msg.content;

        formattedContent = formattedContent.replace(codeBlockRegex, (_: any, lang: string, code: string) => {
          const language = lang || 'text';
          const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          return `<div class="code-block">
						<div class="code-header">${language}</div>
						<pre><code class="language-${language}">${escapedCode}</code></pre>
					</div>`;
        });

        formattedContent = formattedContent
          .split('\n')
          .map((line: string) => {
            if (line.trim().startsWith('- ')) {
              return `<li>${line.substring(2)}</li>`;
            }
            if (line.trim().startsWith('* ')) {
              return `<li>${line.substring(2)}</li>`;
            }
            if (line.trim() === '') {
              return '<br>';
            }
            return `<p>${line}</p>`;
          })
          .join('');

        return `<div class="message ${cssClass}">
					<div class="message-header">${role}</div>
					<div class="message-content">
						${images}
						${formattedContent}
					</div>
				</div>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Conversation</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            line-height: 1.6;
        }

        .session-header {
            border-bottom: 2px solid var(--vscode-panel-border);
            padding-bottom: 15px;
            margin-bottom: 25px;
        }

        .session-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .session-meta {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        .message {
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
        }

        .message-header {
            padding: 8px 12px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .user-message .message-header {
            background-color: rgba(0, 122, 204, 0.15);
            color: var(--vscode-textLink-foreground);
        }

        .assistant-message .message-header {
            background-color: rgba(106, 153, 85, 0.15);
            color: #6a9955;
        }

        .message-content {
            padding: 15px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
        }

        .message-content p {
            margin: 0 0 8px 0;
        }

        .message-content br {
            display: block;
            margin: 4px 0;
        }

        .message-content li {
            margin-left: 20px;
        }

        .image-container {
            margin: 10px 0;
            text-align: center;
        }

        .image-container img {
            max-width: 100%;
            max-height: 400px;
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border);
        }

        .image-label {
            display: block;
            margin-top: 5px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .code-block {
            margin: 10px 0;
            border-radius: 4px;
            overflow: hidden;
            background-color: var(--vscode-textCodeBlock-background);
        }

        .code-header {
            padding: 6px 12px;
            background-color: rgba(0, 0, 0, 0.2);
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .code-block pre {
            margin: 0;
            padding: 12px;
            overflow-x: auto;
        }

        .code-block code {
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="session-header">
        <div class="session-title">${session.title}</div>
        <div class="session-meta">
            <span>ID: ${session.shortId}</span> •
            <span>${createdDate}</span> •
            <span>${session.messageCount} messages</span>
            ${session.tokenPercentage ? ` • <span>${session.tokenPercentage}% tokens</span>` : ''}
        </div>
    </div>

    <div class="conversation">
        ${messagesHtml}
    </div>
</body>
</html>`;
  }
}
