import { Command } from '../common/vscode/vscode-commands';
import type { AddLabelParams } from './internal/sessions/add-label';
import type { ToggleCheckSessionParams } from './internal/sessions/check-session';
import type { CompactSessionParams } from './internal/sessions/compact';
import type { CopySessionPathParams, OpenSessionFileParams } from './internal/sessions/file-operations';
import type { TogglePinSessionParams } from './internal/sessions/pin-session';
import type { ViewCompactionParams } from './internal/sessions/view-compaction';
import type { ViewSessionDetailsParams } from './internal/sessions/view-details';

export type CommandParams = {
  [Command.AddLabel]: AddLabelParams;
  [Command.CompactSession]: CompactSessionParams;
  [Command.ViewCompaction]: ViewCompactionParams;
  [Command.TogglePinSession]: TogglePinSessionParams;
  [Command.OpenSessionFile]: OpenSessionFileParams;
  [Command.CopySessionPath]: CopySessionPathParams;
  [Command.ToggleCheckSession]: ToggleCheckSessionParams;
  [Command.ViewSessionDetails]: ViewSessionDetailsParams;
};
