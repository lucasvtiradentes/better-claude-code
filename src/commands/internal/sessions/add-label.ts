import { logger } from '../../../common/lib/logger';
import { ClaudeHelper, getSessionLabels, getSessionLabelsForSession, toggleSessionLabel } from '../../../common/utils';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { SessionProvider } from '../../../views/sessions/session-provider';
import type { SessionTreeItem } from '../../../views/sessions/tree-items';

export type AddLabelParams = SessionTreeItem;

async function handleAddLabel(item: AddLabelParams, sessionProvider: SessionProvider) {
  try {
    if (!item?.session) {
      VscodeHelper.showToastMessage(ToastKind.Error, 'No session selected');
      logger.error('Add label: No session selected');
      return;
    }

    const workspacePath = VscodeHelper.getFirstWorkspaceFolder()?.uri.fsPath;
    if (!workspacePath) {
      VscodeHelper.showToastMessage(ToastKind.Error, 'No workspace folder found');
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

    const selection = await VscodeHelper.showQuickPick(labelOptions, {
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

    VscodeHelper.showToastMessage(ToastKind.Info, `Label "${selection.label.replace('✓ ', '')}" toggled`);
  } catch (error) {
    logger.error('Failed to toggle label', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to toggle label');
  }
}

export function createAddLabelCommand(sessionProvider: SessionProvider) {
  return registerCommand(Command.AddLabel, (item: AddLabelParams) => handleAddLabel(item, sessionProvider));
}
