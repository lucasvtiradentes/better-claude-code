import { MESSAGE_PATTERNS } from '@/lib/shared';
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

export enum FormatterSource {
  SESSION_CARD = 'session-card',
  SESSION_MESSAGE = 'session-message'
}

type FormatOptions = {
  source: FormatterSource;
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

export type CodeBlock = {
  id: string;
  language?: string;
  code: string;
};

export function formatMessageContent(
  text: string,
  options: FormatOptions
): { html: string; imageRefs: Array<{ index: number; exists: boolean; data?: string }>; codeBlocks: CodeBlock[] } {
  const { source, pathValidation, searchTerm, availableImages = [], images = [], messageId } = options;

  if (source === FormatterSource.SESSION_CARD) {
    return { html: text, imageRefs: [], codeBlocks: [] };
  }

  const codeBlocks: CodeBlock[] = [];

  const parsedCommand = detectCommand(text);
  if (parsedCommand) {
    return { html: formatCommand(parsedCommand), imageRefs: [], codeBlocks: [] };
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

  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const id = `code-block-${codeBlocks.length}`;
    codeBlocks.push({
      id,
      language: lang,
      code: code.trim()
    });
    return `<CODE_BLOCK_${id}>`;
  });

  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted/80 dark:bg-muted px-1.5 py-0.5 rounded text-sm border border-border dark:border-border/80 dark:text-foreground/95">$1</code>'
  );

  formatted = formatted.replace(/\n---\n/g, '<div class="h-px bg-border my-3 w-[40%] mx-auto"></div>');

  formatted = formatted.replace(/\n######\s+([^\n]+)\n?/g, '<br /><HEADER6>$1</HEADER6>');
  formatted = formatted.replace(/\n#####\s+([^\n]+)\n?/g, '<br /><HEADER5>$1</HEADER5>');
  formatted = formatted.replace(/\n####\s+([^\n]+)\n?/g, '<br /><HEADER4>$1</HEADER4>');
  formatted = formatted.replace(/\n###\s+([^\n]+)\n?/g, '<br /><HEADER3>$1</HEADER3>');
  formatted = formatted.replace(/\n##\s+([^\n]+)\n?/g, '<br /><HEADER2>$1</HEADER2>');
  formatted = formatted.replace(/\n#\s+([^\n]+)\n?/g, '<br /><HEADER1>$1</HEADER1>');

  formatted = formatted.replace(/\n(\d+)\.\s/g, '<br />$1. ');

  formatted = formatted.replace(/\n/g, '<br />');

  formatted = formatted.replace(/<HEADER6>([^<]+)<\/HEADER6>/g, '<div class="text-base font-semibold">$1</div>');
  formatted = formatted.replace(/<HEADER5>([^<]+)<\/HEADER5>/g, '<div class="text-lg font-semibold">$1</div>');
  formatted = formatted.replace(/<HEADER4>([^<]+)<\/HEADER4>/g, '<div class="text-xl font-semibold">$1</div>');
  formatted = formatted.replace(/<HEADER3>([^<]+)<\/HEADER3>/g, '<div class="text-2xl font-semibold">$1</div>');
  formatted = formatted.replace(/<HEADER2>([^<]+)<\/HEADER2>/g, '<div class="text-3xl font-semibold">$1</div>');
  formatted = formatted.replace(/<HEADER1>([^<]+)<\/HEADER1>/g, '<div class="text-4xl font-bold">$1</div>');

  formatted = formatted.replace(/<CODE_BLOCK_(code-block-\d+)>/g, '<div data-code-block="$1"></div>');

  return { html: formatted, imageRefs, codeBlocks };
}
