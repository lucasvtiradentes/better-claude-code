import * as vscode from 'vscode';
import { ClaudeHelper, getSessionLabels, getSessionLabelsForSession, toggleSessionLabel } from '@/lib/node-utils';
import { logger } from '../common/utils/logger.js';
import type { SessionProvider } from '../sidebar/session-provider.js';
import type { SessionTreeItem } from '../sidebar/tree-items.js';

export function registerAddLabelCommand(context: vscode.ExtensionContext, sessionProvider: SessionProvider): void {
  const command = vscode.commands.registerCommand('bcc.addLabel', async (item: SessionTreeItem) => {
    try {
      if (!item?.session) {
        vscode.window.showErrorMessage('No session selected');
        logger.error('Add label: No session selected');
        return;
      }

      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspacePath) {
        vscode.window.showErrorMessage('No workspace folder found');
        logger.error('Add label: No workspace folder found');
        return;
      }

      const projectName = ClaudeHelper.normalizePathForClaudeProjects(workspacePath);
      const sessionId = item.session.id;

      logger.info(`Add label: projectName=${projectName}, sessionId=${sessionId}`);

      const allLabels = getSessionLabels();
      logger.info(`Add label: Found ${allLabels.length} labels: ${allLabels.map((l) => l.name).join(', ')}`);

      const currentLabels = getSessionLabelsForSession(projectName, sessionId);
      logger.info(`Add label: Session has ${currentLabels.length} labels: ${currentLabels.join(', ')}`);

      const labelOptions = allLabels.map((label) => ({
        label: currentLabels.includes(label.id) ? `✓ ${label.name}` : label.name,
        description: label.color,
        value: label.id,
        picked: currentLabels.includes(label.id)
      }));

      const selection = await vscode.window.showQuickPick(labelOptions, {
        placeHolder: 'Select a label to toggle',
        matchOnDescription: false
      });

      if (!selection) {
        logger.info('Add label: User cancelled selection');
        return;
      }

      logger.info(`Add label: Toggling label ${selection.value}`);
      const updatedLabels = toggleSessionLabel(projectName, sessionId, selection.value);
      logger.info(`Add label: Session now has labels: ${updatedLabels.join(', ')}`);

      sessionProvider.updateSessionLabels(sessionId, updatedLabels);

      vscode.window.showInformationMessage(`Label "${selection.label.replace('✓ ', '')}" toggled`);
    } catch (error) {
      logger.error('Failed to toggle label', error as Error);
      vscode.window.showErrorMessage('Failed to toggle label');
    }
  });

  context.subscriptions.push(command);
}
