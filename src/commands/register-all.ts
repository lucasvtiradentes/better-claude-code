import type { Disposable, ExtensionContext } from '../common/vscode/vscode-types';
import { createStatusBarCommands } from '../status-bar/status-bar-actions';
import type { CommandsProvider } from '../views/commands/commands-provider';
import type { SessionProvider } from '../views/sessions/session-provider';
import { createCommandOperationsCommands } from './internal/commands/command-operations';
import { createAddLabelCommand } from './internal/sessions/add-label';
import { createBatchOperationsCommands } from './internal/sessions/batch-operations';
import { createCheckSessionCommands } from './internal/sessions/check-session';
import { createCompactSessionCommand } from './internal/sessions/compact';
import { createFileOperationsCommands } from './internal/sessions/file-operations';
import { createTogglePinSessionCommand } from './internal/sessions/pin-session';
import { createViewCompactionCommand } from './internal/sessions/view-compaction';
import { createViewSessionDetailsCommand } from './internal/sessions/view-details';
import { createFilterSessionsCommand } from './internal/sidebar/filter';
import { createRefreshSessionsCommand } from './internal/sidebar/refresh';
import { createToggleCollapseExpandCommand } from './internal/sidebar/toggle-collapse';
import { createClearWorkspaceStateCommand } from './public/clear-workspace-state';
import { createShowLogsCommand } from './public/show-logs';
import { createShowWorkspaceStateCommand } from './public/show-workspace-state';

type DecorationProvider = {
  refresh(): void;
};

export function registerAllCommands(options: {
  context: ExtensionContext;
  sessionProvider: SessionProvider;
  commandsProvider: CommandsProvider;
  decorationProvider: DecorationProvider;
  workspacePath: string;
}): Disposable[] {
  const { context, sessionProvider, commandsProvider, decorationProvider, workspacePath } = options;

  return [
    createRefreshSessionsCommand(sessionProvider, decorationProvider),
    createFilterSessionsCommand(sessionProvider),
    createToggleCollapseExpandCommand(sessionProvider),
    createCompactSessionCommand(sessionProvider, decorationProvider, workspacePath),
    createViewCompactionCommand(workspacePath),
    createViewSessionDetailsCommand(context, sessionProvider),
    createAddLabelCommand(sessionProvider),
    createTogglePinSessionCommand(sessionProvider),
    ...createFileOperationsCommands(),
    ...createCheckSessionCommands(sessionProvider),
    ...createBatchOperationsCommands(sessionProvider, decorationProvider, workspacePath),
    ...createCommandOperationsCommands(commandsProvider),
    ...createStatusBarCommands(),
    createShowLogsCommand(),
    createShowWorkspaceStateCommand(),
    createClearWorkspaceStateCommand()
  ];
}
