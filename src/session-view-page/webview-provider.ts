import type { MessageFiltersState } from '../common/schemas/workspace-state.schema';
import { NodePathHelper } from '../common/utils/helpers/node-helper';
import { logger } from '../common/utils/logger';
import { VscodeConstants } from '../common/vscode/vscode-constants';
import { VscodeHelper } from '../common/vscode/vscode-helper';
import type { ExtensionContext, WebviewPanel } from '../common/vscode/vscode-types';
import type { SessionListItem } from '../views/sessions/core';
import type { SessionProvider } from '../views/sessions/session-provider';
import { createMessageHandler } from './webview-message-handlers';
import { getSessionPanelHtml } from './webview-templates';

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
      panel.webview.postMessage({ type: 'filtersUpdated', filters });
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

      const panel = WebviewProvider.createPanel(context, session);

      WebviewProvider.panels.set(session.id, panel);
      WebviewProvider.notifyPanelChange();

      panel.onDidDispose(() => {
        WebviewProvider.panels.delete(session.id);
        WebviewProvider.notifyPanelChange();
      });

      const messageHandler = createMessageHandler({
        panel,
        session,
        sessionProvider,
        broadcastFiltersUpdate: WebviewProvider.broadcastFiltersUpdate
      });

      panel.webview.onDidReceiveMessage(messageHandler, undefined, context.subscriptions);
      panel.webview.html = getSessionPanelHtml(context, panel.webview);
    } catch (error) {
      logger.error('Failed to show session conversation', error as Error);
      VscodeHelper.showErrorMessageSimple('Failed to display session conversation');
    }
  }

  private static createPanel(context: ExtensionContext, session: SessionListItem): WebviewPanel {
    const activeEditor = VscodeHelper.getActiveTextEditor();
    const column = activeEditor ? activeEditor.viewColumn : undefined;

    return VscodeHelper.createWebviewPanel(
      'bccSessionConversation',
      `Session: ${session.shortId}`,
      column || VscodeConstants.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [VscodeHelper.createFileUri(NodePathHelper.join(context.extensionPath, 'out', 'webview'))]
      }
    );
  }
}
