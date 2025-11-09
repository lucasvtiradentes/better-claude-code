import { Bot } from 'lucide-react';
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

  const isUser = isUserMessage(message.type);

  return (
    <div className={`mb-3 flex gap-2 items-start ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-2">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`
          p-2 px-3 rounded-md wrap-break-word max-w-[85%]
          ${isUser ? 'bg-secondary' : 'bg-card'}
          ${isSearchMatch ? 'ring-2 ring-chart-2' : ''}
        `}
      >
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

      {isUser && (
        <img src="https://github.com/lucasvtiradentes.png" alt="User" className="h-6 w-6 shrink-0 rounded-full mt-2" />
      )}
    </div>
  );
};
