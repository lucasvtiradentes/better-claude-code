import { Command, getCommandId } from '../../common/vscode/vscode-commands';
import { VscodeConstants } from '../../common/vscode/vscode-constants';
import { ThemeIconClass, TreeItemClass } from '../../common/vscode/vscode-types';
import type { RuleInfo } from './types';

export class RuleTreeItem extends TreeItemClass {
  public readonly ruleInfo: RuleInfo;

  constructor(info: RuleInfo) {
    const prefix = info.isGlobal ? '(G) ' : '';
    const label = `${prefix}${info.name}`;
    super(label, VscodeConstants.TreeItemCollapsibleState.None);

    this.ruleInfo = info;
    this.description = info.relativePath || '';
    this.tooltip = info.filePath;
    this.contextValue = info.isGlobal ? 'ruleItemGlobal' : 'ruleItem';
    this.iconPath = new ThemeIconClass('law');

    this.command = {
      command: getCommandId(Command.OpenRuleFile),
      title: 'Open Rule',
      arguments: [this]
    };
  }
}
