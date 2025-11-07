import { MESSAGE_PATTERNS, MessageSource } from '@better-claude-code/shared';
import type { GetApiSessionsProjectNameSessionId200MessagesItem } from '@/api/_generated/schemas';
import {
  detectCommand,
  formatCommand,
  formatFileOrFolderMention,
  formatImageTag,
  formatPathProperty,
  formatPattern,
  formatSearchHighlight,
  formatToolPath,
  formatToolWithQuote,
  formatUltrathink
} from '@/features/projects/utils/message-patterns';

type SessionMessageProps = {
  message: GetApiSessionsProjectNameSessionId200MessagesItem;
  imageOffset: number;
  onImageClick: (imageIndex: number) => void;
  onPathClick?: (path: string) => void;
  pathValidation?: Array<{ path: string; exists: boolean }>;
  searchTerm?: string;
  isSearchMatch?: boolean;
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

function parseCommandFormat(text: string): string | null {
  const command = detectCommand(text);
  if (command) {
    return formatCommand(command);
  }
  return null;
}

function applyCommonFormatting(
  text: string,
  pathValidation?: Array<{ path: string; exists: boolean }>,
  searchTerm?: string
): {
  formatted: string;
  imageRefs: Array<{ placeholder: string; index: number }>;
} {
  let formatted = text;

  const imageRefs: Array<{ placeholder: string; index: number }> = [];
  formatted = formatted.replace(MESSAGE_PATTERNS.IMAGE_TAG, (_match, num) => {
    const placeholder = `__IMAGE_${num}__`;
    imageRefs.push({ placeholder, index: Number.parseInt(num, 10) });
    return placeholder;
  });

  formatted = formatted.replace(MESSAGE_PATTERNS.FILE_OR_FOLDER_AT, (_match, prefix, filePath) =>
    formatFileOrFolderMention(prefix, filePath, pathValidation)
  );

  formatted = formatted.replace(MESSAGE_PATTERNS.ULTRATHINK, formatUltrathink);

  if (searchTerm) {
    const escapedTerm = escapeHtml(searchTerm);
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    formatted = formatted.replace(regex, (_match, term) => formatSearchHighlight(term));
  }

  return { formatted, imageRefs };
}

function formatMessage(
  text: string,
  pathValidation?: Array<{ path: string; exists: boolean }>,
  searchTerm?: string
): { html: string; imageRefs: Array<{ placeholder: string; index: number }> } {
  const parsedCommand = parseCommandFormat(text);
  if (parsedCommand) {
    return { html: parsedCommand, imageRefs: [] };
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

  const { formatted: withCommon, imageRefs } = applyCommonFormatting(formatted, pathValidation, searchTerm);
  formatted = withCommon;

  formatted = formatted.replace(/\n---\n/g, '<div class="h-px bg-border my-3 w-[40%] mx-auto"></div>');

  formatted = formatted.replace(/\n/g, '<br />');

  return { html: formatted, imageRefs };
}

export const SessionMessage = ({
  message,
  onImageClick,
  onPathClick,
  pathValidation,
  searchTerm,
  isSearchMatch,
  availableImages = []
}: SessionMessageProps) => {
  if (typeof message.content !== 'string') {
    return null;
  }

  const { html, imageRefs } = formatMessage(message.content, pathValidation, searchTerm);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    console.log('[SessionMessage] Click detected:', {
      tagName: target.tagName,
      className: target.className,
      imageIndex: target.dataset.imageIndex,
      path: target.dataset.path
    });
    if (target.dataset.imageIndex) {
      const index = Number.parseInt(target.dataset.imageIndex, 10);
      console.log('[SessionMessage] Calling onImageClick with index:', index);
      onImageClick(index);
    } else if (target.dataset.path && onPathClick) {
      const exists = target.dataset.exists === 'true';
      if (exists) {
        onPathClick(target.dataset.path);
      }
    }
  };

  return (
    <div
      className={`
        mb-3 p-2 px-3 rounded-md wrap-break-word
        ${message.type === MessageSource.USER ? 'bg-secondary ml-10' : 'bg-card mr-10'}
        ${isSearchMatch ? 'ring-2 ring-chart-2' : ''}
      `}
    >
      <div className="text-[11px] font-semibold mb-1 opacity-70 uppercase leading-none">
        {message.type === MessageSource.USER ? 'User' : 'Claude Code'}
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: dangerouslySetInnerHTML requires div */}
      <div
        className="whitespace-pre-wrap"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e as any);
          }
        }}
        role="button"
        tabIndex={0}
        dangerouslySetInnerHTML={{
          __html: imageRefs.reduce((content, { placeholder, index }) => {
            const exists = availableImages.includes(index);
            return content.replace(placeholder, formatImageTag(index, exists));
          }, html)
        }}
      />
    </div>
  );
};
