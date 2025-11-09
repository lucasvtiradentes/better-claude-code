import { MESSAGE_PATTERNS } from '@better-claude-code/shared';
import { MESSAGE_COLORS } from './message-colors';
import {
  detectCommand,
  formatCommand,
  formatFileOrFolderMention,
  formatFlag,
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
  images?: Array<{ index: number; data: string; messageId: string }>;
  messageId?: string;
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
): { html: string; imageRefs: Array<{ index: number; exists: boolean; data?: string }> } {
  const { source, pathValidation, searchTerm, availableImages = [], images = [], messageId } = options;

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

  const imageRefs: Array<{ index: number; exists: boolean; data?: string }> = [];
  formatted = formatted.replace(MESSAGE_PATTERNS.IMAGE_TAG, (_match, num) => {
    const index = Number.parseInt(num, 10);
    const exists = availableImages.includes(index);
    const image = images.find((img) => img.index === index && img.messageId === messageId);
    imageRefs.push({ index, exists, data: image?.data });

    const colorClasses = exists ? MESSAGE_COLORS.EXISTING_IMAGE_TAG : MESSAGE_COLORS.NOT_FOUND_IMAGE_TAG;
    const classes = `inline-block text-sm px-2 py-1 rounded border transition-colors font-semibold ${colorClasses}`;
    return `<span class="${classes}">[Image #${index}]</span>`;
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

  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted/80 dark:bg-muted px-1.5 py-0.5 rounded text-sm border border-border dark:border-border/80 dark:text-foreground/95">$1</code>'
  );

  formatted = formatted.replace(/\n---\n/g, '<div class="h-px bg-border my-3 w-[40%] mx-auto"></div>');

  formatted = formatted.replace(/\n(\d+)\.\s/g, '<br />$1. ');

  formatted = formatted.replace(/\n/g, '<br />');

  return { html: formatted, imageRefs };
}
