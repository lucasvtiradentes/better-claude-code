import type { GetApiSessionsProjectNameSessionId200MessagesItem } from '@/api/_generated/schemas';
import { MessageSource as FormatterSource, formatMessageContent } from '@/features/projects/utils/message-formatter';
import { isUserMessage } from '../../utils/message-utils';

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

  const { html } = formatMessageContent(message.content, {
    source: FormatterSource.SESSION_MESSAGE,
    pathValidation,
    searchTerm,
    availableImages
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (target.dataset.imageIndex) {
      const index = Number.parseInt(target.dataset.imageIndex, 10);
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
        ${isUserMessage(message.type) ? 'bg-secondary ml-10' : 'bg-card mr-10'}
        ${isSearchMatch ? 'ring-2 ring-chart-2' : ''}
      `}
    >
      <div className="text-[11px] font-semibold mb-1 opacity-70 uppercase leading-none">
        {isUserMessage(message.type) ? 'User' : 'Claude Code'}
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
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
