import { existsSync, writeFileSync } from 'node:fs';
import { CLAUDE_CODE_SETTINGS_PATH } from '@/lib/node-utils';
import { Command, registerCommand } from '../../common/vscode/vscode-commands';
import { ToastKind, VscodeHelper } from '../../common/vscode/vscode-helper';
import type { Disposable } from '../../common/vscode/vscode-types';

export function createOpenGlobalSettingsCommand(): Disposable {
  return registerCommand(Command.OpenGlobalSettings, async () => {
    if (!existsSync(CLAUDE_CODE_SETTINGS_PATH)) {
      writeFileSync(CLAUDE_CODE_SETTINGS_PATH, '{}', 'utf-8');
    }

    try {
      await VscodeHelper.openDocumentByPath(CLAUDE_CODE_SETTINGS_PATH);
    } catch {
      VscodeHelper.showToastMessage(ToastKind.Error, 'Failed to open Claude Code settings');
    }
  });
}
