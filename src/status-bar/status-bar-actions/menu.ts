import { APP_NAME } from '@/common/utils';
import { Command, executeCommand, registerCommand } from '../../common/vscode/vscode-commands';
import { VscodeHelper } from '../../common/vscode/vscode-helper';
import type { Disposable } from '../../common/vscode/vscode-types';

enum SettingsMenuOption {
  OpenGlobalSettings = 'open-global-settings',
  OpenGlobalInstructions = 'open-global-instructions'
}

export function createOpenSettingsMenuCommand(): Disposable {
  return registerCommand(Command.OpenSettingsMenu, async () => {
    const menuItems = [
      {
        id: SettingsMenuOption.OpenGlobalSettings,
        label: '$(gear) Open Global Settings',
        detail: 'Open ~/.claude/settings.json'
      },
      {
        id: SettingsMenuOption.OpenGlobalInstructions,
        label: '$(book) Open Global Instructions',
        detail: 'Open ~/.claude/CLAUDE.md'
      }
    ];

    const selected = await VscodeHelper.showQuickPick(menuItems, {
      placeHolder: `${APP_NAME} Settings`
    });

    if (!selected) return;

    switch (selected.id) {
      case SettingsMenuOption.OpenGlobalSettings:
        await executeCommand(Command.OpenGlobalSettings);
        break;
      case SettingsMenuOption.OpenGlobalInstructions:
        await executeCommand(Command.OpenGlobalInstructions);
        break;
    }
  });
}
