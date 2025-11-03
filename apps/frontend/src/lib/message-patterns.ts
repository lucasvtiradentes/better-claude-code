import { MESSAGE_PATTERNS } from '@bcc/shared';
import { MESSAGE_COLORS } from './message-colors';

export { MESSAGE_PATTERNS };

export function getTokenColor(percentage: number): string {
  if (percentage >= 80) return MESSAGE_COLORS.TOKEN_HIGH;
  if (percentage >= 50) return MESSAGE_COLORS.TOKEN_MEDIUM;
  return MESSAGE_COLORS.TOKEN_LOW;
}

export function getFileInTitleColor(): string {
  return MESSAGE_COLORS.EXISTING_FILE_OR_FOLDER;
}

export function getCommandInTitleColor(): string {
  return MESSAGE_COLORS.COMMAND;
}

export function getLabelActiveColor(): string {
  return MESSAGE_COLORS.LABEL_ACTIVE;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function detectCommand(text: string): string | null {
  const commandNameMatch = text.match(MESSAGE_PATTERNS.COMMAND_FORMAT);
  const commandArgsMatch = text.match(MESSAGE_PATTERNS.COMMAND_ARGS);

  if (commandNameMatch) {
    const cmdName = commandNameMatch[1];
    const cmdArgs = commandArgsMatch ? commandArgsMatch[1] : '';
    const fullCommand = cmdArgs ? `/${cmdName} ${cmdArgs}` : `/${cmdName}`;
    return fullCommand;
  }

  return null;
}

export function formatCommand(command: string): string {
  return `<span class="${MESSAGE_COLORS.COMMAND}">${escapeHtml(command)}</span>`;
}

export function formatFileOrFolderMention(
  prefix: string,
  filePath: string,
  pathValidation?: Array<{ path: string; exists: boolean }>
): string {
  const pathExists = pathValidation?.find((p) => p.path === filePath)?.exists ?? true;
  const classes = pathExists ? MESSAGE_COLORS.EXISTING_FILE_OR_FOLDER : MESSAGE_COLORS.NOT_FOUND_FILE_OR_FOLDER;
  return `${prefix}<span class="${classes}" data-path="${escapeHtml(filePath)}" data-exists="${pathExists}">@${escapeHtml(filePath)}</span>`;
}

export function formatToolPath(
  tool: string,
  filePath: string,
  pathValidation?: Array<{ path: string; exists: boolean }>
): string {
  const pathExists = pathValidation?.find((p) => p.path === filePath)?.exists ?? true;
  const classes = pathExists ? MESSAGE_COLORS.EXISTING_FILE_OR_FOLDER : MESSAGE_COLORS.NOT_FOUND_FILE_OR_FOLDER;
  return `[Tool: ${tool}] <span class="${classes}" data-path="${escapeHtml(filePath)}" data-exists="${pathExists}">${escapeHtml(filePath)}</span>`;
}

export function formatPathProperty(
  filePath: string,
  pathValidation?: Array<{ path: string; exists: boolean }>
): string {
  const pathExists = pathValidation?.find((p) => p.path === filePath)?.exists ?? true;
  const classes = pathExists ? MESSAGE_COLORS.EXISTING_FILE_OR_FOLDER : MESSAGE_COLORS.NOT_FOUND_FILE_OR_FOLDER;
  return `path: <span class="${classes}" data-path="${escapeHtml(filePath)}" data-exists="${pathExists}">${escapeHtml(filePath)}</span>`;
}

export function formatPattern(pattern: string): string {
  return `pattern: "<span class="${MESSAGE_COLORS.PATTERN}">${pattern}</span>"`;
}

export function formatToolWithQuote(tool: string, quote: string): string {
  return `[Tool: ${tool}] "<span class="${MESSAGE_COLORS.PATTERN}">${quote}</span>"`;
}

export function formatUltrathink(): string {
  return `<span class="${MESSAGE_COLORS.ULTRATHINK}">ultrathink</span>`;
}

export function formatSearchHighlight(term: string): string {
  return `<mark class="${MESSAGE_COLORS.SEARCH_HIGHLIGHT}">${term}</mark>`;
}

export function formatImageTag(index: number, exists = true): string {
  const colorClasses = exists ? MESSAGE_COLORS.EXISTING_IMAGE_TAG : MESSAGE_COLORS.NOT_FOUND_IMAGE_TAG;
  const interactionClasses = exists ? 'cursor-pointer' : '';
  const classes = `inline-block text-sm px-2 py-1 rounded border transition-colors font-semibold ${colorClasses} ${interactionClasses}`;
  const dataAttr = exists ? `data-image-index="${index}"` : '';
  return `<span ${dataAttr} class="${classes}">[Image #${index}]</span>`;
}

export function parseTitle(title: string): Array<{ text: string; type: 'normal' | 'file' | 'command' }> {
  const parts: Array<{ text: string; type: 'normal' | 'file' | 'command' }> = [];
  const isCommand = MESSAGE_PATTERNS.COMMAND_WORDS.test(title) || MESSAGE_PATTERNS.SLASH_COMMAND.test(title);

  const fileMatches: Array<{ index: number; text: string }> = [];
  const regex = new RegExp(MESSAGE_PATTERNS.FILE_OR_FOLDER_AT.source, 'g');
  let match: RegExpExecArray | null = regex.exec(title);

  while (match !== null) {
    const prefixLength = match[1].length;
    fileMatches.push({
      index: match.index + prefixLength,
      text: `@${match[2]}`
    });
    match = regex.exec(title);
  }

  if (fileMatches.length === 0) {
    parts.push({ text: title, type: isCommand ? 'command' : 'normal' });
    return parts;
  }

  let lastIndex = 0;
  for (const fileMatch of fileMatches) {
    if (fileMatch.index > lastIndex) {
      const text = title.slice(lastIndex, fileMatch.index);
      parts.push({ text, type: isCommand ? 'command' : 'normal' });
    }
    parts.push({ text: fileMatch.text, type: 'file' });
    lastIndex = fileMatch.index + fileMatch.text.length;
  }

  if (lastIndex < title.length) {
    const text = title.slice(lastIndex);
    parts.push({ text, type: isCommand ? 'command' : 'normal' });
  }

  return parts;
}
