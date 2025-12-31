import { DEV_SUFFIX } from './scripts-constants.js';

export const APP_NAME = 'Better Claude Code';
export const IS_DEV = __IS_DEV_BUILD__;

export function addDevSuffix(str: string): string {
  return IS_DEV ? `${str}${DEV_SUFFIX}` : str;
}

export function getCommandId(command: string): string {
  return addDevSuffix(command);
}

export function getViewId(viewId: string): string {
  return addDevSuffix(viewId);
}
