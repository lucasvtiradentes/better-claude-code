import * as vscode from 'vscode';
import type { Uri, WorkspaceFolder } from './vscode-types';

export enum ToastKind {
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}

export class VscodeHelper {
  static getFirstWorkspaceFolder(): WorkspaceFolder | undefined {
    return vscode.workspace.workspaceFolders?.[0];
  }

  static getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] {
    return vscode.workspace.workspaceFolders ?? [];
  }

  static async openDocument(uri: Uri, options?: vscode.TextDocumentShowOptions): Promise<vscode.TextEditor> {
    return vscode.window.showTextDocument(uri, options);
  }

  static async openDocumentByPath(
    filePath: string,
    options?: vscode.TextDocumentShowOptions
  ): Promise<vscode.TextEditor> {
    return vscode.window.showTextDocument(vscode.Uri.file(filePath), options);
  }

  static async openUntitledDocument(content: string, language?: string): Promise<vscode.TextEditor> {
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

  static async showQuickPick<T extends vscode.QuickPickItem>(
    items: T[],
    options?: vscode.QuickPickOptions
  ): Promise<T | undefined> {
    return vscode.window.showQuickPick(items, options);
  }

  static async showQuickPickStrings(items: string[], options?: vscode.QuickPickOptions): Promise<string | undefined> {
    return vscode.window.showQuickPick(items, options);
  }

  static async showInputBox(
    options?: vscode.InputBoxOptions,
    token?: vscode.CancellationToken
  ): Promise<string | undefined> {
    return vscode.window.showInputBox(options, token);
  }

  static async withProgress<T>(
    options: vscode.ProgressOptions,
    task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Thenable<T>
  ): Promise<T> {
    return vscode.window.withProgress(options, task);
  }

  static createFileUri(filePath: string): vscode.Uri {
    return vscode.Uri.file(filePath);
  }

  static createStatusBarItem(alignment?: vscode.StatusBarAlignment, priority?: number): vscode.StatusBarItem {
    return vscode.window.createStatusBarItem(alignment, priority);
  }

  static async writeToClipboard(text: string): Promise<void> {
    return vscode.env.clipboard.writeText(text);
  }

  static async openExternal(url: string): Promise<boolean> {
    return vscode.env.openExternal(vscode.Uri.parse(url));
  }
}
