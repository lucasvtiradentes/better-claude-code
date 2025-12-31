import * as vscode from 'vscode';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';

export function registerFilterCommand(context: vscode.ExtensionContext, sessionProvider: SessionProvider): void {
  const command = vscode.commands.registerCommand('bcc.filterSessions', async () => {
    try {
      const filterOptions = [
        { label: '📅 Group by Date', value: 'group-date', description: 'Group sessions by time periods' },
        { label: '🔢 Group by Token Usage', value: 'group-tokens', description: 'Group sessions by token percentage' },
        { label: '🏷️ Group by Label', value: 'group-label', description: 'Group sessions by labels' }
      ];

      const selection = await vscode.window.showQuickPick(filterOptions, {
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
          vscode.window.showInformationMessage('Grouped by: Date');
          break;

        case 'group-tokens':
          logger.info('Filter: Setting groupBy to token-percentage');
          sessionProvider.setGroupBy('token-percentage');
          vscode.window.showInformationMessage('Grouped by: Token Usage');
          break;

        case 'group-label':
          logger.info('Filter: Setting groupBy to label');
          sessionProvider.setGroupBy('label');
          vscode.window.showInformationMessage('Grouped by: Label');
          break;
      }
    } catch (error) {
      logger.error('Failed to change grouping', error as Error);
      vscode.window.showErrorMessage('Failed to change grouping');
    }
  });

  context.subscriptions.push(command);
}
