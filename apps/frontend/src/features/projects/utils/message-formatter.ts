import { MESSAGE_PATTERNS } from '@better-claude-code/shared';
import {
  detectCommand,
  formatCommand,
  formatFileOrFolderMention,
  formatFlag,
  formatImageTag,
  formatPathProperty,
  formatPattern,
  formatSearchHighlight,
  formatToolPath,
  formatToolWithQuote,
  formatUltrathink,
  formatUrl
} from './message-patterns';

export enum MessageSource {
  SESSION_CARD = 'session-card',
  SESSION_MESSAGE = 'session-message'
}

type FormatOptions = {
  source: MessageSource;
  pathValidation?: Array<{ path: string; exists: boolean }>;
  searchTerm?: string;
  availableImages?: number[];
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatMessageContent(
  text: string,
  options: FormatOptions
): { html: string; imageRefs: Array<{ placeholder: string; index: number }> } {
  const { source, pathValidation, searchTerm, availableImages = [] } = options;

  if (source === MessageSource.SESSION_CARD) {
    return { html: text, imageRefs: [] };
  }

  const parsedCommand = detectCommand(text);
  if (parsedCommand) {
    return { html: formatCommand(parsedCommand), imageRefs: [] };
  }

  let formatted = escapeHtml(text).replace(/\\/g, '');

  formatted = formatted.replace(MESSAGE_PATTERNS.TOOL_WITH_PATH, (_match, tool, filePath) =>
    formatToolPath(tool, filePath, pathValidation)
  );

  formatted = formatted.replace(MESSAGE_PATTERNS.PATTERN_PROPERTY, (_match, pattern) => formatPattern(pattern));

  formatted = formatted.replace(MESSAGE_PATTERNS.PATH_PROPERTY, (_match, filePath) =>
    formatPathProperty(filePath, pathValidation)
  );

  formatted = formatted.replace(MESSAGE_PATTERNS.TOOL_WITH_QUOTE, (_match, tool, quote) =>
    formatToolWithQuote(tool, quote)
  );

  const imageRefs: Array<{ placeholder: string; index: number }> = [];
  formatted = formatted.replace(MESSAGE_PATTERNS.IMAGE_TAG, (_match, num) => {
    const placeholder = `__IMAGE_${num}__`;
    imageRefs.push({ placeholder, index: Number.parseInt(num, 10) });
    return placeholder;
  });

  formatted = formatted.replace(MESSAGE_PATTERNS.FILE_OR_FOLDER_AT, (_match, prefix, filePath) =>
    formatFileOrFolderMention(prefix, filePath, pathValidation)
  );

  formatted = formatted.replace(MESSAGE_PATTERNS.URL, (match) => formatUrl(match));

  formatted = formatted.replace(MESSAGE_PATTERNS.FLAG, (_match, prefix, flag) => `${prefix}${formatFlag(flag)}`);

  formatted = formatted.replace(MESSAGE_PATTERNS.ULTRATHINK, formatUltrathink);

  if (searchTerm) {
    const escapedTerm = escapeHtml(searchTerm);
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    formatted = formatted.replace(regex, (_match, term) => formatSearchHighlight(term));
  }

  formatted = formatted.replace(/\n---\n/g, '<div class="h-px bg-border my-3 w-[40%] mx-auto"></div>');

  formatted = formatted.replace(/\n/g, '<br />');

  const finalHtml = imageRefs.reduce((content, { placeholder, index }) => {
    const exists = availableImages.includes(index);
    return content.replace(placeholder, formatImageTag(index, exists));
  }, formatted);

  return { html: finalHtml, imageRefs };
}
