import { Command, getCommandId } from '../../common/vscode/vscode-commands';
import { BaseResourceTreeItem, type ResourceInfo } from '../_base/base-tree-item';

export class SkillTreeItem extends BaseResourceTreeItem {
  constructor(info: ResourceInfo) {
    super(info, 'symbol-method', 'skillItem');

    this.command = {
      command: getCommandId(Command.OpenSkillFile),
      title: 'Open Skill',
      arguments: [this]
    };
  }
}
