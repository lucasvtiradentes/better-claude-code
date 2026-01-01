import type { MessageFiltersState } from '../common/schemas/workspace-state.schema';
import { messageFiltersState } from '../common/state';
import { logger } from '../common/utils/logger';
import { VscodeConstants } from '../common/vscode/vscode-constants';
import { VscodeHelper } from '../common/vscode/vscode-helper';
import type { WebviewPanel } from '../common/vscode/vscode-types';
import type { SessionListItem } from '../views/sessions/core';
import type { SessionProvider } from '../views/sessions/session-provider';
import { getImagePreviewHtml } from './webview-templates';

type MessageHandlerContext = {
  panel: WebviewPanel;
  session: SessionListItem;
  sessionProvider: SessionProvider;
  broadcastFiltersUpdate: (filters: MessageFiltersState) => void;
};

type MessageHandler = (ctx: MessageHandlerContext, message: Record<string, unknown>) => void | Promise<void>;

const handleReady: MessageHandler = async (ctx, _message) => {
  logger.info(`[WebviewProvider] Received 'ready' for session ${ctx.session.shortId}`);
  const conversation = await ctx.sessionProvider.getSessionConversation(ctx.session);
  const filters = messageFiltersState.load();
  logger.info(`[WebviewProvider] Sending filters to webview: ${JSON.stringify(filters)}`);
  ctx.panel.webview.postMessage({
    type: 'sessionData',
    data: {
      session: {
        id: ctx.session.id,
        title: ctx.session.title,
        shortId: ctx.session.shortId,
        createdAt: ctx.session.createdAt,
        messageCount: ctx.session.messageCount,
        tokenPercentage: ctx.session.tokenPercentage,
        compacted: ctx.session.hasCompaction
      },
      conversation,
      filters
    }
  });
};

const handleSaveFilters: MessageHandler = (ctx, message) => {
  logger.info(`[WebviewProvider] Received 'saveFilters': ${JSON.stringify(message.filters)}`);
  messageFiltersState.save(message.filters as MessageFiltersState);
  ctx.broadcastFiltersUpdate(message.filters as MessageFiltersState);
};

const handleOpenImage: MessageHandler = (_ctx, message) => {
  const imageData = message.imageData as string;
  const imageIndex = message.imageIndex as number;

  const imagePanel = VscodeHelper.createWebviewPanel(
    'imagePreview',
    `Image #${imageIndex}`,
    VscodeConstants.ViewColumn.Beside,
    { enableScripts: false, retainContextWhenHidden: false }
  );

  imagePanel.webview.html = getImagePreviewHtml(imageData, imageIndex);
};

const handleOpenRawSession: MessageHandler = async (ctx, _message) => {
  const sessionPath = ctx.sessionProvider.getSessionPath(ctx.session.id);
  if (sessionPath) {
    await VscodeHelper.openDocumentByPath(sessionPath, {
      viewColumn: VscodeConstants.ViewColumn.Beside
    });
  }
};

const handleDeleteSession: MessageHandler = async (ctx, _message) => {
  logger.info(`[WebviewProvider] Delete requested for session ${ctx.session.shortId} (${ctx.session.id})`);
  try {
    const confirmed = await VscodeHelper.showWarningMessage(
      `Delete session ${ctx.session.shortId}? This will also delete any compaction files.`,
      { modal: true },
      'Delete'
    );
    logger.info(`[WebviewProvider] User confirmation: ${confirmed}`);

    if (confirmed === 'Delete') {
      logger.info(`[WebviewProvider] Starting deletion of session ${ctx.session.id}`);
      await ctx.sessionProvider.deleteSession(ctx.session.id);
      logger.info(`[WebviewProvider] Session deleted, disposing panel`);
      ctx.panel.dispose();
      logger.info(`[WebviewProvider] Panel disposed, refreshing sidebar`);
      await ctx.sessionProvider.refresh();
      logger.info(`[WebviewProvider] Sidebar refreshed`);
      VscodeHelper.showInformationMessageSimple(`Session ${ctx.session.shortId} deleted successfully`);
    }
  } catch (error) {
    logger.error(`[WebviewProvider] Delete session error: ${(error as Error).message}`, error as Error);
    VscodeHelper.showErrorMessageSimple(`Failed to delete session: ${(error as Error).message}`);
  }
};

const handleCompactSession: MessageHandler = async (ctx, _message) => {
  try {
    const summaryPath = await VscodeHelper.withProgress(
      {
        location: VscodeConstants.ProgressLocation.Notification,
        title: `Compacting session ${ctx.session.shortId}...`,
        cancellable: false
      },
      () => ctx.sessionProvider.compactSession(ctx.session.id)
    );

    VscodeHelper.showInformationMessageSimple(`Session ${ctx.session.shortId} compacted successfully`);

    await VscodeHelper.openDocumentByPath(summaryPath, {
      viewColumn: VscodeConstants.ViewColumn.Beside
    });

    await ctx.sessionProvider.refresh();
  } catch (error) {
    logger.error('Failed to compact session', error as Error);
    VscodeHelper.showErrorMessageSimple(`Failed to compact session: ${(error as Error).message}`);
  }
};

const handleOpenParsed: MessageHandler = async (ctx, _message) => {
  const parsedPath = await ctx.sessionProvider.getParsedSessionPath(ctx.session.id);
  if (parsedPath) {
    await VscodeHelper.openDocumentByPath(parsedPath, {
      viewColumn: VscodeConstants.ViewColumn.Beside
    });
  } else {
    VscodeHelper.showWarningMessageSimple('Parsed session file not found');
  }
};

const handleOpenSummary: MessageHandler = async (ctx, _message) => {
  const summaryPath = await ctx.sessionProvider.getSummaryPath(ctx.session.id);
  if (summaryPath) {
    await VscodeHelper.openDocumentByPath(summaryPath, {
      viewColumn: VscodeConstants.ViewColumn.Beside
    });
  } else {
    VscodeHelper.showWarningMessageSimple('Summary file not found');
  }
};

const messageHandlers: Record<string, MessageHandler> = {
  ready: handleReady,
  saveFilters: handleSaveFilters,
  openImage: handleOpenImage,
  openRawSession: handleOpenRawSession,
  deleteSession: handleDeleteSession,
  compactSession: handleCompactSession,
  openParsed: handleOpenParsed,
  openSummary: handleOpenSummary
};

export function createMessageHandler(ctx: MessageHandlerContext) {
  return async (message: Record<string, unknown>) => {
    const messageType = message.type as string;
    logger.info(`[WebviewProvider] Message received - type: ${messageType}, sessionId: ${ctx.session.id}`);

    const handler = messageHandlers[messageType];
    if (handler) {
      await handler(ctx, message);
    }
  };
}
