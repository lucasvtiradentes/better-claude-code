import { logger } from '../../../common/lib/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import type { SessionProvider } from '../../../views/sessions/session-provider';

function handleToggleCollapseExpand(sessionProvider: SessionProvider) {
  logger.info('Toggle collapse/expand command triggered');
  sessionProvider.toggleCollapseExpand();
}

export function createToggleCollapseExpandCommand(sessionProvider: SessionProvider) {
  return registerCommand(Command.ToggleCollapseExpand, () => handleToggleCollapseExpand(sessionProvider));
}
