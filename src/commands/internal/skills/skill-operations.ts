import { logger } from '../../../common/lib/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { Disposable } from '../../../common/vscode/vscode-types';
import type { SkillsProvider } from '../../../views/skills/skills-provider';
import { SkillTreeItem } from '../../../views/skills/tree-items';

async function handleOpenSkillFile(item: SkillTreeItem) {
  if (!item || !(item instanceof SkillTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a skill');
    return;
  }

  try {
    await VscodeHelper.openDocumentByPath(item.filePath);
    logger.info(`Opened skill file: ${item.filePath}`);
  } catch (error) {
    logger.error('Failed to open skill file', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open skill file');
  }
}

export function createSkillOperationsCommands(skillsProvider: SkillsProvider): Disposable[] {
  return [
    registerCommand(Command.OpenSkillFile, handleOpenSkillFile),
    registerCommand(Command.RefreshSkills, () => skillsProvider.refresh())
  ];
}
