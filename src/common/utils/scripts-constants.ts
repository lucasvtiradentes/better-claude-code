export const EXTENSION_NAME = 'better-claude-code-vscode';
export const EXTENSION_DISPLAY_NAME = 'Better Claude Code';
export const CONTEXT_PREFIX = 'bcc';
export const DEV_SUFFIX = 'Dev';

export function addDevSuffixStatic(str: string): string {
  return `${str}${DEV_SUFFIX}`;
}

export function addDevLabel(str: string): string {
  return `${str} (${DEV_SUFFIX})`;
}
