import { Bot } from 'lucide-react';
import type {
  GetApiSessionsProjectNameSessionId200ImagesItem,
  GetApiSessionsProjectNameSessionId200MessagesItem
} from '@/api/_generated/schemas';
import { MessageSource as FormatterSource, formatMessageContent } from '@/features/projects/utils/message-formatter';
import { isUserMessage } from '../../utils/message-utils';

type SessionMessageProps = {
  messages: GetApiSessionsProjectNameSessionId200MessagesItem[];
  imageOffset: number;
  onImageClick: (imageIndex: number) => void;
  onPathClick?: (path: string) => void;
  pathValidation?: Array<{ path: string; exists: boolean }>;
  searchTerm?: string;
  isSearchMatch?: boolean;
  availableImages?: number[];
  images?: GetApiSessionsProjectNameSessionId200ImagesItem[];
};

export const SessionMessage = ({
  messages,
  onImageClick,
  onPathClick,
  pathValidation,
  searchTerm,
  isSearchMatch,
  availableImages = [],
  images = []
}: SessionMessageProps) => {
  if (messages.length === 0) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
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

  const isUser = isUserMessage(messages[0].type);

  return (
    <div className={`mb-3 flex gap-2 items-start ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-2">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`
          p-2 px-3 rounded-md wrap-break-word max-w-[85%] flex flex-col gap-2
          ${isUser ? 'bg-secondary' : 'bg-card'}
          ${isSearchMatch ? 'ring-2 ring-chart-2' : ''}
        `}
      >
        {messages.map((message, idx) => {
          if (typeof message.content !== 'string') {
            return null;
          }

          const { html } = formatMessageContent(message.content, {
            source: FormatterSource.SESSION_MESSAGE,
            pathValidation,
            searchTerm,
            availableImages,
            images,
            messageId: message.id
          });

          const messageKey = message.id || `msg-${message.timestamp}-${idx}`;

          return (
            <div key={messageKey}>
              {idx > 0 && (
                <div className="flex justify-center my-2">
                  <div className="w-1/2 border-t border-border" />
                </div>
              )}
              <button
                type="button"
                className="whitespace-pre-wrap text-left w-full"
                onClick={handleClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e as any);
                  }
                }}
                tabIndex={0}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          );
        })}
      </div>

      {isUser && (
        <img src="https://github.com/lucasvtiradentes.png" alt="User" className="h-6 w-6 shrink-0 rounded-full mt-2" />
      )}
    </div>
  );
};
