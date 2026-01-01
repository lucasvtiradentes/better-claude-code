import { Command, getCommandId } from '../../common/vscode/vscode-commands';
import { BaseResourceTreeItem, type ResourceInfo } from '../_base/base-tree-item';

export class CommandTreeItem extends BaseResourceTreeItem {
  constructor(info: ResourceInfo) {
    super(info, 'file-code', 'commandItem');

    this.command = {
      command: getCommandId(Command.OpenCommandFile),
      title: 'Open Command',
      arguments: [this]
    };
  }
}
