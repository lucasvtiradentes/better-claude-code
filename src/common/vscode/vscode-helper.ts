import * as vscode from 'vscode';
import type { VscodeColor, VscodeColorString, VscodeIcon, VscodeIconString } from './vscode-constants';
import type {
  CancellationToken,
  Disposable,
  FileDecorationProvider,
  FileSystemWatcher,
  OutputChannel,
  ProgressOptions,
  TextDocumentShowOptions,
  TextEditor,
  ThemeIcon,
  TreeView,
  TreeViewOptions,
  Uri,
  WebviewOptions,
  WebviewPanel,
  WebviewPanelOptions,
  WorkspaceFolder
} from './vscode-types';

export enum ToastKind {
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}

export class VscodeHelper {
  static getFirstWorkspaceFolder(): WorkspaceFolder | undefined {
    return vscode.workspace.workspaceFolders?.[0];
  }

  static getWorkspaceFolders(): readonly WorkspaceFolder[] {
    return vscode.workspace.workspaceFolders ?? [];
  }

  static async openDocument(uri: Uri, options?: TextDocumentShowOptions): Promise<TextEditor> {
    return vscode.window.showTextDocument(uri, options);
  }

  static async openDocumentByPath(filePath: string, options?: TextDocumentShowOptions): Promise<TextEditor> {
    return vscode.window.showTextDocument(vscode.Uri.file(filePath), options);
  }

  static async openUntitledDocument(content: string, language?: string): Promise<TextEditor> {
    const doc = await vscode.workspace.openTextDocument({ content, language });
    return vscode.window.showTextDocument(doc);
  }

  static showToastMessage(kind: ToastKind, message: string): void {
    switch (kind) {
      case ToastKind.Info:
        void vscode.window.showInformationMessage(message);
        break;
      case ToastKind.Warning:
        void vscode.window.showWarningMessage(message);
        break;
      case ToastKind.Error:
        void vscode.window.showErrorMessage(message);
        break;
    }
  }

  static async showWarningMessage(
    message: string,
    options: { modal?: boolean },
    ...items: string[]
  ): Promise<string | undefined> {
    return vscode.window.showWarningMessage(message, options, ...items);
  }

  static showWarningMessageSimple(message: string, ...items: string[]): Thenable<string | undefined> {
    return vscode.window.showWarningMessage(message, ...items);
  }

  static showErrorMessageSimple(message: string): Thenable<string | undefined> {
    return vscode.window.showErrorMessage(message);
  }

  static showInformationMessageSimple(message: string): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(message);
  }

  static async showQuickPick<T extends vscode.QuickPickItem>(
    items: T[],
    options?: vscode.QuickPickOptions
  ): Promise<T | undefined> {
    return vscode.window.showQuickPick(items, options);
  }

  static async showQuickPickStrings(items: string[], options?: vscode.QuickPickOptions): Promise<string | undefined> {
    return vscode.window.showQuickPick(items, options);
  }

  static async showInputBox(options?: vscode.InputBoxOptions, token?: CancellationToken): Promise<string | undefined> {
    return vscode.window.showInputBox(options, token);
  }

  static async withProgress<T>(
    options: ProgressOptions,
    task: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: CancellationToken) => Thenable<T>
  ): Promise<T> {
    return vscode.window.withProgress(options, task);
  }

  static createFileUri(filePath: string): Uri {
    return vscode.Uri.file(filePath);
  }

  static parseUri(value: string): Uri {
    return vscode.Uri.parse(value);
  }

  static joinPath(base: Uri, ...pathSegments: string[]): Uri {
    return vscode.Uri.joinPath(base, ...pathSegments);
  }

  static createStatusBarItem(alignment?: vscode.StatusBarAlignment, priority?: number): vscode.StatusBarItem {
    return vscode.window.createStatusBarItem(alignment, priority);
  }

  static createOutputChannel(name: string): OutputChannel {
    return vscode.window.createOutputChannel(name);
  }

  static createTreeView<T>(viewId: string, options: TreeViewOptions<T>): TreeView<T> {
    return vscode.window.createTreeView(viewId, options);
  }

  static createWebviewPanel(
    viewType: string,
    title: string,
    showOptions: vscode.ViewColumn | { viewColumn: vscode.ViewColumn; preserveFocus?: boolean },
    options?: WebviewPanelOptions & WebviewOptions
  ): WebviewPanel {
    return vscode.window.createWebviewPanel(viewType, title, showOptions, options);
  }

  static createFileSystemWatcher(
    globPattern: vscode.GlobPattern,
    ignoreCreateEvents?: boolean,
    ignoreChangeEvents?: boolean,
    ignoreDeleteEvents?: boolean
  ): FileSystemWatcher {
    return vscode.workspace.createFileSystemWatcher(
      globPattern,
      ignoreCreateEvents,
      ignoreChangeEvents,
      ignoreDeleteEvents
    );
  }

  static async writeToClipboard(text: string): Promise<void> {
    return vscode.env.clipboard.writeText(text);
  }

  static async openExternal(url: string): Promise<boolean> {
    return vscode.env.openExternal(vscode.Uri.parse(url));
  }

  static createIcon(icon: VscodeIcon, color?: VscodeColor): ThemeIcon {
    return color ? new vscode.ThemeIcon(icon, new vscode.ThemeColor(color)) : new vscode.ThemeIcon(icon);
  }

  static createCustomIcon(icon: VscodeIconString, color?: VscodeColorString): ThemeIcon {
    return color ? new vscode.ThemeIcon(icon, new vscode.ThemeColor(color)) : new vscode.ThemeIcon(icon);
  }

  static registerFileDecorationProvider(provider: FileDecorationProvider): Disposable {
    return vscode.window.registerFileDecorationProvider(provider);
  }

  static executeVscodeCommand<T = unknown>(command: string, ...args: unknown[]): Thenable<T> {
    return vscode.commands.executeCommand<T>(command, ...args);
  }

  static getActiveTextEditor(): vscode.TextEditor | undefined {
    return vscode.window.activeTextEditor;
  }

  static getExtensionPath(context: vscode.ExtensionContext): string {
    return context.extensionPath;
  }
}
