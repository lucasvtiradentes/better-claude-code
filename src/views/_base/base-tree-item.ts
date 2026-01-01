import { VscodeConstants } from '../../common/vscode/vscode-constants';
import { ThemeIconClass, TreeItemClass, UriClass } from '../../common/vscode/vscode-types';

export const GLOBAL_ITEM_PREFIX = '(G) ';

export type ResourceInfo = {
  name: string;
  filePath: string;
  isGlobal: boolean;
};

export class BaseResourceTreeItem extends TreeItemClass {
  public readonly filePath: string;
  public readonly isGlobal: boolean;
  public readonly resourceName: string;

  constructor(info: ResourceInfo, icon: string, contextValue: string) {
    const label = info.isGlobal ? `${GLOBAL_ITEM_PREFIX}${info.name}` : info.name;
    super(label, VscodeConstants.TreeItemCollapsibleState.None);

    this.filePath = info.filePath;
    this.isGlobal = info.isGlobal;
    this.resourceName = info.name;
    this.iconPath = new ThemeIconClass(icon);
    this.contextValue = info.isGlobal ? `${contextValue}Global` : contextValue;
    this.tooltip = info.isGlobal ? `Global: ${info.filePath}` : info.filePath;
    this.resourceUri = UriClass.file(info.filePath);
  }
}
