import { clearWorkspaceState } from '../../common/state';
import { Command, registerCommand } from '../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../common/vscode/vscode-helper';

async function handleClearWorkspaceState() {
  try {
    const confirm = await VscodeHelper.showQuickPickStrings(['Yes', 'No'], {
      placeHolder: 'Are you sure you want to clear the workspace state?'
    });
    if (confirm !== 'Yes') return;
    clearWorkspaceState();
    VscodeHelper.showToastMessage(ToastKind.Info, 'Workspace state cleared successfully');
  } catch (error) {
    VscodeHelper.showToastMessage(ToastKind.Error, `Failed to clear workspace state: ${error}`);
  }
}

export function createClearWorkspaceStateCommand() {
  return registerCommand(Command.ClearWorkspaceState, handleClearWorkspaceState);
}
