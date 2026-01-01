import type { Disposable } from '../../common/vscode/vscode-types';
import { createOpenSettingsMenuCommand } from './menu';
import { createOpenGlobalInstructionsCommand } from './open-global-instructions';
import { createOpenGlobalSettingsCommand } from './open-global-settings';

export function createStatusBarCommands(): Disposable[] {
  return [createOpenSettingsMenuCommand(), createOpenGlobalSettingsCommand(), createOpenGlobalInstructionsCommand()];
}
