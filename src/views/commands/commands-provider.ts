import { VscodeConstants } from '../../common/vscode/vscode-constants';
import {
  EventEmitterClass,
  ThemeIconClass,
  type TreeDataProvider,
  type TreeItem,
  TreeItemClass
} from '../../common/vscode/vscode-types';

class PlaceholderTreeItem extends TreeItemClass {
  constructor() {
    super('To be implemented', VscodeConstants.TreeItemCollapsibleState.None);
    this.iconPath = new ThemeIconClass('info');
    this.contextValue = 'placeholder';
  }
}

export class CommandsProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new EventEmitterClass<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  async getChildren(): Promise<TreeItem[]> {
    return [new PlaceholderTreeItem()];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
