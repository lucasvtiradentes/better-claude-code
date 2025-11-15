import * as vscode from 'vscode';
import type { FilterCriteria } from '../types.js';
import type { SessionProvider } from '../ui/session-provider.js';
import { logger } from '../utils/logger.js';

export function registerFilterCommand(context: vscode.ExtensionContext, sessionProvider: SessionProvider): void {
  const command = vscode.commands.registerCommand('bcc.filterSessions', async () => {
    try {
      const filterOptions = [
        { label: 'All Sessions', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'Last 7 Days', value: 'week' },
        { label: 'Last 30 Days', value: 'month' },
        { label: 'Has Images', value: 'images' },
        { label: 'Has Custom Commands', value: 'commands' },
        { label: 'Clear Filters', value: 'clear' }
      ];

      const selection = await vscode.window.showQuickPick(filterOptions, {
        placeHolder: 'Select a filter option'
      });

      if (!selection) {
        return;
      }

      let filter: FilterCriteria = {};

      const now = new Date();

      switch (selection.value) {
        case 'all':
          break;

        case 'today': {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filter = {
            dateRange: {
              start: todayStart
            }
          };
          break;
        }

        case 'week': {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - 7);
          filter = {
            dateRange: {
              start: weekStart
            }
          };
          break;
        }

        case 'month': {
          const monthStart = new Date(now);
          monthStart.setDate(monthStart.getDate() - 30);
          filter = {
            dateRange: {
              start: monthStart
            }
          };
          break;
        }

        case 'images':
          filter = {
            hasImages: true
          };
          break;

        case 'commands':
          filter = {
            hasCustomCommands: true
          };
          break;

        case 'clear':
          filter = {};
          break;
      }

      logger.info(`Applying filter: ${JSON.stringify(filter)}`);
      sessionProvider.setFilter(filter);

      vscode.window.showInformationMessage(`Filter applied: ${selection.label}`);
    } catch (error) {
      logger.error('Failed to apply filter', error as Error);
      vscode.window.showErrorMessage('Failed to apply filter');
    }
  });

  context.subscriptions.push(command);
}
