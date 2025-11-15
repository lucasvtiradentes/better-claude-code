import * as vscode from 'vscode';
import { LOG_FILE_PATH } from '../utils/logger.js';

export function createShowLogsCommand(): vscode.Disposable {
  return vscode.commands.registerCommand('bcc.showLogs', async () => {
    try {
      const doc = await vscode.workspace.openTextDocument(LOG_FILE_PATH);
      await vscode.window.showTextDocument(doc, { preview: false });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open logs: ${error}`);
    }
  });
}
