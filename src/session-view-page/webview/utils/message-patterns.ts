import { MESSAGE_COLORS } from './message-colors';

export const MESSAGE_PATTERNS = {
  FILE_OR_FOLDER_AT: /(^|\s)@([a-zA-Z.][\w\-.]*(?:\/[\w\-./]+)*(?:#L\d+(?:-\d+)?)?)/g,
  FILE_OR_FOLDER_SLASH: /\/([\w\-./]+)/g,
  TOOL_WITH_PATH: /\[Tool: ([^\]]+)\] (\/[^\s<>,]+)/g,
  PATH_PROPERTY: /path: (\/[^\s<>,]+)/g,
  PATTERN_PROPERTY: /pattern: "([^"]+)"/g,
  TOOL_WITH_QUOTE: /\[Tool: ([^\]]+)\] "([^"]+)"/g,
  IMAGE_TAG: /\[Image #(\d+)\]/g,
  ULTRATHINK: /ultrathink/gi,
  URL: /https?:\/\/[^\s<>,]+/g,
  FLAG: /(^|\s)(--[a-z]{2,})/g,
  COMMAND_FORMAT: /<command-name>\/?([^<]+)<\/command-name>/,
  COMMAND_ARGS: /<command-args>([^<]+)<\/command-args>/,
  COMMAND_WORDS:
    /^(add|update|fix|refactor|improve|create|delete|remove|modify|change|implement|build|test|debug|optimize|enhance|cleanup|migrate|upgrade|downgrade|install|uninstall|configure|setup|deploy|publish|release|merge|rebase|cherry-pick|squash|revert)\s+/i,
  SLASH_COMMAND: /^\/[\w-]+/
} as const;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function detectCommand(text: string): string | null {
  const firstLine = text.split('\n')[0].trim();

  const commandNameMatch = firstLine.match(MESSAGE_PATTERNS.COMMAND_FORMAT);
  const commandArgsMatch = firstLine.match(MESSAGE_PATTERNS.COMMAND_ARGS);

  if (commandNameMatch) {
    const cmdName = commandNameMatch[1];
    const cmdArgs = commandArgsMatch ? commandArgsMatch[1] : '';
    const fullCommand = cmdArgs ? `/${cmdName} ${cmdArgs}` : `/${cmdName}`;
    return fullCommand;
  }

  return null;
}

export function formatCommand(command: string) {
  return `<span class="${MESSAGE_COLORS.COMMAND}">${escapeHtml(command)}</span>`;
}

export function formatFileOrFolderMention(
  prefix: string,
  filePath: string,
  pathValidation?: Array<{ path: string; exists: boolean }>
) {
  const pathExists = pathValidation?.find((p) => p.path === filePath)?.exists ?? true;
  const classes = pathExists ? MESSAGE_COLORS.EXISTING_FILE_OR_FOLDER : MESSAGE_COLORS.NOT_FOUND_FILE_OR_FOLDER;
  return `${prefix}<span class="${classes}" data-path="${escapeHtml(filePath)}" data-exists="${pathExists}">@${escapeHtml(filePath)}</span>`;
}

export function formatToolPath(
  tool: string,
  filePath: string,
  pathValidation?: Array<{ path: string; exists: boolean }>
) {
  const pathExists = pathValidation?.find((p) => p.path === filePath)?.exists ?? true;
  const classes = pathExists ? MESSAGE_COLORS.EXISTING_FILE_OR_FOLDER : MESSAGE_COLORS.NOT_FOUND_FILE_OR_FOLDER;
  return `[Tool: ${tool}] <span class="${classes}" data-path="${escapeHtml(filePath)}" data-exists="${pathExists}">${escapeHtml(filePath)}</span>`;
}

export function formatPathProperty(filePath: string, pathValidation?: Array<{ path: string; exists: boolean }>) {
  const pathExists = pathValidation?.find((p) => p.path === filePath)?.exists ?? true;
  const classes = pathExists ? MESSAGE_COLORS.EXISTING_FILE_OR_FOLDER : MESSAGE_COLORS.NOT_FOUND_FILE_OR_FOLDER;
  return `path: <span class="${classes}" data-path="${escapeHtml(filePath)}" data-exists="${pathExists}">${escapeHtml(filePath)}</span>`;
}

export function formatPattern(pattern: string) {
  return `pattern: "<span class="${MESSAGE_COLORS.PATTERN}">${pattern}</span>"`;
}

export function formatToolWithQuote(tool: string, quote: string) {
  return `[Tool: ${tool}] "<span class="${MESSAGE_COLORS.PATTERN}">${quote}</span>"`;
}

export function formatUltrathink() {
  return `<span class="${MESSAGE_COLORS.ULTRATHINK}">ultrathink</span>`;
}

export function formatUrl(url: string) {
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="${MESSAGE_COLORS.URL}">${escapeHtml(url)}</a>`;
}

export function formatFlag(flag: string) {
  return `<span class="${MESSAGE_COLORS.FLAG}">${escapeHtml(flag)}</span>`;
}

export function formatSearchHighlight(term: string) {
  return `<mark class="${MESSAGE_COLORS.SEARCH_HIGHLIGHT}">${term}</mark>`;
}
