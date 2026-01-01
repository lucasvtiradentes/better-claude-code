import { addDevSuffix } from '../utils';

export enum View {
  SessionExplorer = 'bccSessionExplorer',
  CommandsExplorer = 'bccCommandsExplorer'
}

export function getViewId(view: View): string {
  return addDevSuffix(view);
}
