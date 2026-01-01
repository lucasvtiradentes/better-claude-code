import { Command, getCommandId } from '../../common/vscode/vscode-commands';
import { VscodeConstants } from '../../common/vscode/vscode-constants';
import { ThemeIconClass, TreeItemClass } from '../../common/vscode/vscode-types';
import { type MemoryInfo, MemoryType } from './types';

function getPrefixForMemoryType(memoryType: MemoryType): string {
  switch (memoryType) {
    case MemoryType.Global:
      return '(G) ';
    case MemoryType.Local:
      return '(L) ';
    default:
      return '';
  }
}

export class MemoryTreeItem extends TreeItemClass {
  public readonly memoryInfo: MemoryInfo;

  constructor(info: MemoryInfo) {
    const prefix = getPrefixForMemoryType(info.memoryType);
    const label = `${prefix}${info.name}`;
    super(label, VscodeConstants.TreeItemCollapsibleState.None);

    this.memoryInfo = info;
    this.tooltip = info.filePath;
    this.contextValue = info.memoryType === MemoryType.Global ? 'memoryItemGlobal' : 'memoryItem';
    this.iconPath = new ThemeIconClass('book');

    this.command = {
      command: getCommandId(Command.OpenMemoryFile),
      title: 'Open Memory File',
      arguments: [this]
    };
  }
}
