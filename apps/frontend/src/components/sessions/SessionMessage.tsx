import type { Message } from '@bcc/shared';
import { MESSAGE_COLORS } from '@/lib/message-colors';

type SessionMessageProps = {
  message: Message;
  imageOffset: number;
  onImageClick: (imageIndex: number) => void;
  onPathClick?: (path: string) => void;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseCommandFormat(text: string): string | null {
  const commandNameMatch = text.match(/<command-name>\/?([^<]+)<\/command-name>/);
  const commandArgsMatch = text.match(/<command-args>([^<]+)<\/command-args>/);

  if (commandNameMatch) {
    const cmdName = commandNameMatch[1];
    const cmdArgs = commandArgsMatch ? commandArgsMatch[1] : '';
    const fullCommand = cmdArgs ? `/${cmdName} ${cmdArgs}` : `/${cmdName}`;
    return `<span class="text-chart-2 font-semibold">${escapeHtml(fullCommand)}</span>`;
  }

  return null;
}

function applyCommonFormatting(text: string): {
  formatted: string;
  imageRefs: Array<{ placeholder: string; index: number }>;
} {
  let formatted = text;

  const imageRefs: Array<{ placeholder: string; index: number }> = [];
  formatted = formatted.replace(/\[Image #(\d+)\]/g, (_match, num) => {
    const placeholder = `__IMAGE_${num}__`;
    imageRefs.push({ placeholder, index: Number.parseInt(num, 10) });
    return placeholder;
  });

  formatted = formatted.replace(
    /(^|\s)@([^\s<>]+)/g,
    (_match, prefix, filePath) =>
      `${prefix}<span class="text-primary font-semibold cursor-pointer" data-path="${escapeHtml(filePath)}">@${escapeHtml(filePath)}</span>`
  );

  formatted = formatted.replace(
    /ultrathink/gi,
    '<span class="bg-gradient-to-r from-destructive via-primary to-chart-4 bg-clip-text text-transparent font-semibold">ultrathink</span>'
  );

  return { formatted, imageRefs };
}

function formatMessage(text: string): { html: string; imageRefs: Array<{ placeholder: string; index: number }> } {
  const parsedCommand = parseCommandFormat(text);
  if (parsedCommand) {
    return { html: parsedCommand, imageRefs: [] };
  }

  let formatted = escapeHtml(text).replace(/\\/g, '');

  formatted = formatted.replace(
    /\[Tool: ([^\]]+)\] (\/[^\s<>,]+)/g,
    (_match, tool, filePath) =>
      `[Tool: ${tool}] <span class="text-primary font-semibold cursor-pointer" data-path="${escapeHtml(filePath)}">${escapeHtml(filePath)}</span>`
  );

  formatted = formatted.replace(/pattern: "([^"]+)"/g, 'pattern: "<span class="text-primary font-semibold">$1</span>"');

  formatted = formatted.replace(
    /path: (\/[^\s<>,]+)/g,
    (_match, filePath) =>
      `path: <span class="text-primary font-semibold cursor-pointer" data-path="${escapeHtml(filePath)}">${escapeHtml(filePath)}</span>`
  );

  formatted = formatted.replace(
    /\[Tool: ([^\]]+)\] "([^"]+)"/g,
    '[Tool: $1] "<span class="text-primary font-semibold">$2</span>"'
  );

  const { formatted: withCommon, imageRefs } = applyCommonFormatting(formatted);
  formatted = withCommon;

  formatted = formatted.replace(/\n---\n/g, '<div class="h-px bg-border my-3 w-[40%] mx-auto"></div>');

  formatted = formatted.replace(/\n/g, '<br />');

  return { html: formatted, imageRefs };
}

export const SessionMessage = ({ message, onImageClick, onPathClick }: SessionMessageProps) => {
  if (typeof message.content !== 'string') {
    return null;
  }

  const { html, imageRefs } = formatMessage(message.content);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.dataset.imageIndex) {
      onImageClick(Number.parseInt(target.dataset.imageIndex, 10));
    } else if (target.dataset.path && onPathClick) {
      onPathClick(target.dataset.path);
    }
  };

  return (
    <div
      className={`
        mb-3 p-2 px-3 rounded-md break-words
        ${message.type === 'user' ? 'bg-secondary ml-10' : 'bg-card border-2 border-primary mr-10'}
      `}
    >
      <div className="text-[11px] font-semibold mb-1 opacity-70 uppercase leading-none">
        {message.type === 'user' ? 'User' : 'Claude Code'}
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
          __html: imageRefs.reduce(
            (content, { placeholder, index }) =>
              content.replace(
                placeholder,
                `<span data-image-index="${index}" class="inline-block text-sm px-2 py-1 rounded border transition-colors font-semibold cursor-pointer ${MESSAGE_COLORS.IMAGE_TAG}">[Image #${index}]</span>`
              ),
            html
          )
        }}
      />
    </div>
  );
};
