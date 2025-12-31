import { logger } from '../../../common/utils/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { SessionProvider } from '../../../sidebar/session-provider';

type DecorationProvider = {
  refresh(): void;
};

async function handleRefreshSessions(sessionProvider: SessionProvider, decorationProvider: DecorationProvider) {
  try {
    logger.info('Refreshing sessions...');
    await sessionProvider.refresh();
    decorationProvider.refresh();
    VscodeHelper.showToastMessage(ToastKind.Info, 'Sessions refreshed successfully');
  } catch (error) {
    logger.error('Failed to refresh sessions', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to refresh sessions');
  }
}

export function createRefreshSessionsCommand(sessionProvider: SessionProvider, decorationProvider: DecorationProvider) {
  return registerCommand(Command.RefreshSessions, () => handleRefreshSessions(sessionProvider, decorationProvider));
}
