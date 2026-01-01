import type { Disposable, ExtensionContext } from '../common/vscode/vscode-types';
import { createStatusBarCommands } from '../status-bar/status-bar-actions';
import type { AgentsProvider } from '../views/agents/agents-provider';
import type { CommandsProvider } from '../views/commands/commands-provider';
import type { MCPServersProvider } from '../views/mcp/mcp-provider';
import type { SessionProvider } from '../views/sessions/session-provider';
import type { SkillsProvider } from '../views/skills/skills-provider';
import { createAgentOperationsCommands } from './internal/agents/agent-operations';
import { createCommandOperationsCommands } from './internal/commands/command-operations';
import { createMCPOperationsCommands } from './internal/mcp/mcp-operations';
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
import { createSkillOperationsCommands } from './internal/skills/skill-operations';
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
  skillsProvider: SkillsProvider;
  agentsProvider: AgentsProvider;
  mcpProvider: MCPServersProvider;
  decorationProvider: DecorationProvider;
  workspacePath: string;
}): Disposable[] {
  const {
    context,
    sessionProvider,
    commandsProvider,
    skillsProvider,
    agentsProvider,
    mcpProvider,
    decorationProvider,
    workspacePath
  } = options;

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
    ...createSkillOperationsCommands(skillsProvider),
    ...createAgentOperationsCommands(agentsProvider),
    ...createMCPOperationsCommands(mcpProvider),
    ...createStatusBarCommands(),
    createShowLogsCommand(),
    createShowWorkspaceStateCommand(),
    createClearWorkspaceStateCommand()
  ];
}
