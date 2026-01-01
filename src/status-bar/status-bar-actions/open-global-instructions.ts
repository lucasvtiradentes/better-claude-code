import { FileIOHelper } from '@/common/utils/helpers/node-helper';
import { CLAUDE_CODE_INSTRUCTIONS_PATH } from '@/lib/node-utils';
import { Command, registerCommand } from '../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../common/vscode/vscode-helper';
import type { Disposable } from '../../common/vscode/vscode-types';

export function createOpenGlobalInstructionsCommand(): Disposable {
  return registerCommand(Command.OpenGlobalInstructions, async () => {
    if (!FileIOHelper.fileExists(CLAUDE_CODE_INSTRUCTIONS_PATH)) {
      FileIOHelper.writeFile(CLAUDE_CODE_INSTRUCTIONS_PATH, '# Claude Code Instructions\n');
    }

    try {
      await VscodeHelper.openDocumentByPath(CLAUDE_CODE_INSTRUCTIONS_PATH);
    } catch {
      VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open Claude Code instructions');
    }
  });
}
