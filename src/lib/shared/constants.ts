import { DEV_SUFFIX } from './scripts-constants.js';

export const APP_NAME = 'Better Claude Code';
export const IS_DEV = __IS_DEV_BUILD__;

export function addDevSuffix(str: string): string {
  return IS_DEV ? `${str}${DEV_SUFFIX}` : str;
}
