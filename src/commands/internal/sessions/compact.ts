import { sessionCache } from '@/lib/node-utils';
import { CompactService } from '../../../common/lib/compact-service';
import { logger } from '../../../common/utils/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { VscodeConstants } from '../../../common/vscode/vscode-constants';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { SessionProvider } from '../../../sidebar/session-provider';
import { SessionTreeItem } from '../../../sidebar/tree-items';

export type CompactSessionParams = SessionTreeItem;

type DecorationProvider = {
  refresh(): void;
};

async function handleCompactSession(
  item: CompactSessionParams,
  compactService: CompactService,
  workspacePath: string,
  sessionProvider: SessionProvider,
  decorationProvider: DecorationProvider
) {
  if (!item || !(item instanceof SessionTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a session to compact');
    return;
  }

  try {
    logger.info(`Compacting session ${item.session.id}...`);

    const result = await VscodeHelper.withProgress(
      {
        location: VscodeConstants.ProgressLocation.Notification,
        title: 'Compacting session...',
        cancellable: false
      },
      () => compactService.compactSession(item.session.id, workspacePath)
    );

    VscodeHelper.showToastMessage(ToastKind.Info, `Session compacted successfully: ${item.session.shortId}`);
    logger.info(`Compact result: ${result}`);

    await sessionCache.clear();

    await VscodeHelper.openDocumentByPath(result, { preview: false });

    await sessionProvider.refresh();
    decorationProvider.refresh();
  } catch (error) {
    logger.error('Failed to compact session', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to compact session. Make sure BCC CLI is installed.');
  }
}

export function createCompactSessionCommand(
  sessionProvider: SessionProvider,
  decorationProvider: DecorationProvider,
  workspacePath: string
) {
  const compactService = new CompactService();
  return registerCommand(Command.CompactSession, (item: CompactSessionParams) =>
    handleCompactSession(item, compactService, workspacePath, sessionProvider, decorationProvider)
  );
}
