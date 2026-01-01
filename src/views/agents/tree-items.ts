import { Command, getCommandId } from '../../common/vscode/vscode-commands';
import { BaseResourceTreeItem, type ResourceInfo } from '../_base/base-tree-item';

export class AgentTreeItem extends BaseResourceTreeItem {
  constructor(info: ResourceInfo) {
    super(info, 'robot', 'agentItem');

    this.command = {
      command: getCommandId(Command.OpenAgentFile),
      title: 'Open Agent',
      arguments: [this]
    };
  }
}
