import { FileIOHelper } from '@/common/utils/helpers/node-helper';
import { CLAUDE_CODE_SETTINGS_PATH } from '@/lib/node-utils';
import { Command, registerCommand } from '../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../common/vscode/vscode-helper';
import type { Disposable } from '../../common/vscode/vscode-types';

export function createOpenGlobalSettingsCommand(): Disposable {
  return registerCommand(Command.OpenGlobalSettings, async () => {
    if (!FileIOHelper.fileExists(CLAUDE_CODE_SETTINGS_PATH)) {
      FileIOHelper.writeFile(CLAUDE_CODE_SETTINGS_PATH, '{}');
    }

    try {
      await VscodeHelper.openDocumentByPath(CLAUDE_CODE_SETTINGS_PATH);
    } catch {
      VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open Claude Code settings');
    }
  });
}
