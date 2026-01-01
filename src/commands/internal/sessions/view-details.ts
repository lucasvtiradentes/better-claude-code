import { logger } from '../../../common/utils/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { ExtensionContext } from '../../../common/vscode/vscode-types';
import { WebviewProvider } from '../../../session-view-page/webview-provider';
import type { SessionListItem } from '../../../views/sessions/core';
import type { SessionProvider } from '../../../views/sessions/session-provider';
import { SessionTreeItem } from '../../../views/sessions/tree-items';

export type ViewSessionDetailsParams = SessionTreeItem | SessionListItem;

async function handleViewSessionDetails(
  itemOrSession: ViewSessionDetailsParams,
  context: ExtensionContext,
  sessionProvider: SessionProvider
) {
  try {
    const session = itemOrSession instanceof SessionTreeItem ? itemOrSession.session : itemOrSession;
    logger.info(`Viewing conversation for session ${session.id}`);
    await WebviewProvider.showSessionConversation(context, session, sessionProvider);
  } catch (error) {
    logger.error('Failed to view session conversation', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to view session conversation');
  }
}

export function createViewSessionDetailsCommand(context: ExtensionContext, sessionProvider: SessionProvider) {
  return registerCommand(Command.ViewSessionDetails, (itemOrSession: ViewSessionDetailsParams) =>
    handleViewSessionDetails(itemOrSession, context, sessionProvider)
  );
}
