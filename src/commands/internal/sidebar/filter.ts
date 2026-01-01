import { logger } from '../../../common/lib/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { SessionProvider } from '../../../views/sessions/session-provider';

async function handleFilterSessions(sessionProvider: SessionProvider) {
  try {
    const filterOptions = [
      { label: '📅 Group by Date', value: 'group-date', description: 'Group sessions by time periods' },
      { label: '🔢 Group by Token Usage', value: 'group-tokens', description: 'Group sessions by token percentage' },
      { label: '🏷️ Group by Label', value: 'group-label', description: 'Group sessions by labels' }
    ];

    const selection = await VscodeHelper.showQuickPick(filterOptions, {
      placeHolder: 'Select grouping mode',
      matchOnDescription: true
    });

    if (!selection) {
      logger.info('Filter: User cancelled selection');
      return;
    }

    logger.info(`Filter: Selected ${selection.value}`);

    switch (selection.value) {
      case 'group-date':
        logger.info('Filter: Setting groupBy to date');
        sessionProvider.setGroupBy('date');
        VscodeHelper.showToastMessage(ToastKind.Info, 'Grouped by: Date');
        break;
      case 'group-tokens':
        logger.info('Filter: Setting groupBy to token-percentage');
        sessionProvider.setGroupBy('token-percentage');
        VscodeHelper.showToastMessage(ToastKind.Info, 'Grouped by: Token Usage');
        break;
      case 'group-label':
        logger.info('Filter: Setting groupBy to label');
        sessionProvider.setGroupBy('label');
        VscodeHelper.showToastMessage(ToastKind.Info, 'Grouped by: Label');
        break;
    }
  } catch (error) {
    logger.error('Failed to change grouping', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to change grouping');
  }
}

export function createFilterSessionsCommand(sessionProvider: SessionProvider) {
  return registerCommand(Command.FilterSessions, () => handleFilterSessions(sessionProvider));
}
