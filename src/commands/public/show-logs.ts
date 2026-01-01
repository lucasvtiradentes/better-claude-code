import { LOG_FILE_PATH } from '../../common/lib/logger';
import { Command, registerCommand } from '../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../common/vscode/vscode-helper';

async function handleShowLogs() {
  try {
    await VscodeHelper.openDocument(VscodeHelper.createFileUri(LOG_FILE_PATH), { preview: false });
  } catch (error) {
    VscodeHelper.showToastMessage(ToastKind.Error, `Failed to open logs: ${error}`);
  }
}

export function createShowLogsCommand() {
  return registerCommand(Command.ShowLogs, handleShowLogs);
}
