import { addDevSuffix } from '../constants/constants';

export enum View {
  SessionExplorer = 'bccSessionExplorer',
  CommandsExplorer = 'bccCommandsExplorer',
  SkillsExplorer = 'bccSkillsExplorer',
  AgentsExplorer = 'bccAgentsExplorer',
  MCPServersExplorer = 'bccMCPServersExplorer',
  RulesExplorer = 'bccRulesExplorer',
  MemoryExplorer = 'bccMemoryExplorer'
}

export function getViewId(view: View): string {
  return addDevSuffix(view);
}
