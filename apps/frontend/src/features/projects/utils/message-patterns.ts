import { MESSAGE_PATTERNS } from '@better-claude-code/shared';
import { MESSAGE_COLORS } from './message-colors';

export function getTokenColor(percentage: number) {
  if (percentage >= 80) return MESSAGE_COLORS.TOKEN_HIGH;
  if (percentage >= 50) return MESSAGE_COLORS.TOKEN_MEDIUM;
  return MESSAGE_COLORS.TOKEN_LOW;
}

export function getFileInTitleColor() {
  return MESSAGE_COLORS.EXISTING_FILE_OR_FOLDER;
}

export function getCommandInTitleColor() {
  return MESSAGE_COLORS.COMMAND;
}

export function getLabelActiveColor() {
  return MESSAGE_COLORS.LABEL_ACTIVE;
}

export function getUrlColor() {
  return MESSAGE_COLORS.URL;
}

export function getUltrathinkColor() {
  return MESSAGE_COLORS.ULTRATHINK;
}

export function getFlagColor() {
  return MESSAGE_COLORS.FLAG;
}

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

export function formatImageTag(index: number, exists = true, imageData?: string) {
  if (imageData) {
    return `<div class="my-2 max-w-md"><img src="data:image/png;base64,${imageData}" alt="Image #${index}" class="rounded-lg border border-border shadow-sm cursor-pointer hover:opacity-90 transition-opacity w-full" data-image-index="${index}" /></div>`;
  }

  const colorClasses = exists ? MESSAGE_COLORS.EXISTING_IMAGE_TAG : MESSAGE_COLORS.NOT_FOUND_IMAGE_TAG;
  const interactionClasses = exists ? 'cursor-pointer' : '';
  const classes = `inline-block text-sm px-2 py-1 rounded border transition-colors font-semibold ${colorClasses} ${interactionClasses}`;
  const dataAttr = exists ? `data-image-index="${index}"` : '';
  return `<span ${dataAttr} class="${classes}">[Image #${index}]</span>`;
}

export function parseTitle(
  title: string
): Array<{ text: string; type: 'normal' | 'file' | 'command' | 'url' | 'ultrathink' | 'flag' }> {
  const parts: Array<{ text: string; type: 'normal' | 'file' | 'command' | 'url' | 'ultrathink' | 'flag' }> = [];
  const isCommand = MESSAGE_PATTERNS.COMMAND_WORDS.test(title) || MESSAGE_PATTERNS.SLASH_COMMAND.test(title);

  const allMatches: Array<{ index: number; text: string; type: 'file' | 'url' | 'ultrathink' | 'flag' }> = [];

  const fileRegex = new RegExp(MESSAGE_PATTERNS.FILE_OR_FOLDER_AT.source, 'g');
  let fileMatch: RegExpExecArray | null = fileRegex.exec(title);
  while (fileMatch !== null) {
    const prefixLength = fileMatch[1].length;
    allMatches.push({
      index: fileMatch.index + prefixLength,
      text: `@${fileMatch[2]}`,
      type: 'file'
    });
    fileMatch = fileRegex.exec(title);
  }

  const urlRegex = new RegExp(MESSAGE_PATTERNS.URL.source, 'g');
  let urlMatch: RegExpExecArray | null = urlRegex.exec(title);
  while (urlMatch !== null) {
    allMatches.push({
      index: urlMatch.index,
      text: urlMatch[0],
      type: 'url'
    });
    urlMatch = urlRegex.exec(title);
  }

  const ultrathinkRegex = new RegExp(MESSAGE_PATTERNS.ULTRATHINK.source, 'gi');
  let ultrathinkMatch: RegExpExecArray | null = ultrathinkRegex.exec(title);
  while (ultrathinkMatch !== null) {
    allMatches.push({
      index: ultrathinkMatch.index,
      text: ultrathinkMatch[0],
      type: 'ultrathink'
    });
    ultrathinkMatch = ultrathinkRegex.exec(title);
  }

  const flagRegex = new RegExp(MESSAGE_PATTERNS.FLAG.source, 'g');
  let flagMatch: RegExpExecArray | null = flagRegex.exec(title);
  while (flagMatch !== null) {
    const prefixLength = flagMatch[1].length;
    allMatches.push({
      index: flagMatch.index + prefixLength,
      text: flagMatch[2],
      type: 'flag'
    });
    flagMatch = flagRegex.exec(title);
  }

  allMatches.sort((a, b) => a.index - b.index);

  if (allMatches.length === 0) {
    parts.push({ text: title, type: isCommand ? 'command' : 'normal' });
    return parts;
  }

  let lastIndex = 0;
  for (const match of allMatches) {
    if (match.index > lastIndex) {
      const text = title.slice(lastIndex, match.index);
      parts.push({ text, type: isCommand ? 'command' : 'normal' });
    }
    parts.push({ text: match.text, type: match.type });
    lastIndex = match.index + match.text.length;
  }

  if (lastIndex < title.length) {
    const text = title.slice(lastIndex);
    parts.push({ text, type: isCommand ? 'command' : 'normal' });
  }

  return parts;
}
