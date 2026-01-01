import { addDevSuffix } from '../constants/constants';

export enum View {
  SessionExplorer = 'bccSessionExplorer',
  CommandsExplorer = 'bccCommandsExplorer',
  SkillsExplorer = 'bccSkillsExplorer'
}

export function getViewId(view: View): string {
  return addDevSuffix(view);
}
