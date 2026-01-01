import * as vscode from 'vscode';

export const VscodeConstants = {
  get TreeItemCollapsibleState() {
    return vscode.TreeItemCollapsibleState;
  },
  get ProgressLocation() {
    return vscode.ProgressLocation;
  },
  get ViewColumn() {
    return vscode.ViewColumn;
  },
  get StatusBarAlignment() {
    return vscode.StatusBarAlignment;
  },
  get FileType() {
    return vscode.FileType;
  }
};

export enum VscodeIcon {
  Account = 'account',
  Add = 'add',
  Archive = 'archive',
  ArrowLeft = 'arrow-left',
  ArrowUp = 'arrow-up',
  Beaker = 'beaker',
  Book = 'book',
  Check = 'check',
  Checklist = 'checklist',
  CircleFilled = 'circle-filled',
  CircleLargeOutline = 'circle-large-outline',
  ClearAll = 'clear-all',
  Close = 'close',
  Copy = 'copy',
  Edit = 'edit',
  Error = 'error',
  Eye = 'eye',
  EyeClosed = 'eye-closed',
  File = 'file',
  FileText = 'file-text',
  Filter = 'filter',
  Folder = 'folder',
  FolderOpened = 'folder-opened',
  Gear = 'gear',
  History = 'history',
  Link = 'link',
  LinkExternal = 'link-external',
  Note = 'note',
  Output = 'output',
  Package = 'package',
  PassFilled = 'pass-filled',
  Pin = 'pin',
  PinFilled = 'pinned',
  Refresh = 'refresh',
  SettingsGear = 'settings-gear',
  SquareSelection = 'selection',
  SymbolEvent = 'symbol-event',
  Tag = 'tag',
  Target = 'target',
  Terminal = 'terminal',
  Trash = 'trash',
  Warning = 'warning'
}

export type VscodeIconString = VscodeIcon | (string & {});

export enum VscodeColor {
  ChartsGreen = 'charts.green',
  ChartsBlue = 'charts.blue',
  ChartsRed = 'charts.red',
  ChartsPurple = 'charts.purple',
  ChartsOrange = 'charts.orange',
  ChartsYellow = 'charts.yellow',
  DisabledForeground = 'disabledForeground',
  ErrorForeground = 'errorForeground',
  TestingIconPassed = 'testing.iconPassed',
  EditorWarningForeground = 'editorWarning.foreground',
  EditorInfoForeground = 'editorInfo.foreground'
}

export type VscodeColorString = VscodeColor | (string & {});
