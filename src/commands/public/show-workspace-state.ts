import { loadWorkspaceState } from '../../common/state';
import { Command, registerCommand } from '../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../common/vscode/vscode-helper';

async function handleShowWorkspaceState() {
  try {
    const state = loadWorkspaceState();
    const content = JSON.stringify(state, null, 2);
    await VscodeHelper.openUntitledDocument(content, 'json');
  } catch (error) {
    VscodeHelper.showToastMessage(ToastKind.Error, `Failed to show workspace state: ${error}`);
  }
}

export function createShowWorkspaceStateCommand() {
  return registerCommand(Command.ShowWorkspaceState, handleShowWorkspaceState);
}
