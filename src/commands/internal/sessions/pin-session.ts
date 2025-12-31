import { logger } from '../../../common/utils/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { SessionProvider } from '../../../sidebar/session-provider';
import { SessionTreeItem } from '../../../sidebar/tree-items';

export type TogglePinSessionParams = SessionTreeItem;

function handleTogglePinSession(item: TogglePinSessionParams, sessionProvider: SessionProvider) {
  if (!item || !(item instanceof SessionTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a session to pin/unpin');
    return;
  }

  try {
    const isPinned = sessionProvider.togglePinSession(item.session.id);
    const action = isPinned ? 'pinned' : 'unpinned';
    logger.info(`Session ${item.session.shortId} ${action}`);
    VscodeHelper.showToastMessage(ToastKind.Info, `Session ${action}: ${item.session.shortId}`);
  } catch (error) {
    logger.error('Failed to toggle pin session', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to toggle pin session');
  }
}

export function createTogglePinSessionCommand(sessionProvider: SessionProvider) {
  return registerCommand(Command.TogglePinSession, (item: TogglePinSessionParams) =>
    handleTogglePinSession(item, sessionProvider)
  );
}
