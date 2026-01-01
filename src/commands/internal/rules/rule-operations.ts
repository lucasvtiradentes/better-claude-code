import { logger } from '../../../common/lib/logger';
import { Command, registerCommand } from '../../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../../common/vscode/vscode-helper';
import type { Disposable } from '../../../common/vscode/vscode-types';
import type { RulesProvider } from '../../../views/rules/rules-provider';
import { RuleTreeItem } from '../../../views/rules/tree-items';

async function handleOpenRuleFile(item: RuleTreeItem) {
  if (!item || !(item instanceof RuleTreeItem)) {
    VscodeHelper.showToastMessage(ToastKind.Error, 'Please select a rule');
    return;
  }

  try {
    await VscodeHelper.openDocumentByPath(item.ruleInfo.filePath);
    logger.info(`Opened rule file: ${item.ruleInfo.filePath}`);
  } catch (error) {
    logger.error('Failed to open rule file', error as Error);
    VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open rule file');
  }
}

export function createRuleOperationsCommands(rulesProvider: RulesProvider): Disposable[] {
  return [
    registerCommand(Command.OpenRuleFile, handleOpenRuleFile),
    registerCommand(Command.RefreshRules, () => rulesProvider.refresh())
  ];
}
