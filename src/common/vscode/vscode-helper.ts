import * as vscode from 'vscode';

export enum ToastKind {
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}

export const VscodeHelper = {
  showToastMessage(kind: ToastKind, message: string): void {
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
  },

  async openDocument(uri: vscode.Uri, options?: { preview?: boolean }): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: options?.preview ?? true });
  },

  createFileUri(filePath: string): vscode.Uri {
    return vscode.Uri.file(filePath);
  },

  async showQuickPick<T extends vscode.QuickPickItem>(
    items: T[],
    options?: vscode.QuickPickOptions
  ): Promise<T | undefined> {
    return vscode.window.showQuickPick(items, options);
  },

  async showWarningMessage(
    message: string,
    options: { modal?: boolean },
    ...items: string[]
  ): Promise<string | undefined> {
    return vscode.window.showWarningMessage(message, options, ...items);
  },

  async withProgress<T>(
    options: vscode.ProgressOptions,
    task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Thenable<T>
  ): Promise<T> {
    return vscode.window.withProgress(options, task);
  },

  getFirstWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    return vscode.workspace.workspaceFolders?.[0];
  }
};
