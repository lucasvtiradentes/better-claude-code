import { Bot } from 'lucide-react';
import { useMemo } from 'react';
import type { PathValidation, SessionImage, SessionMessage as SessionMessageType } from '../types/session';
import { type CodeBlock as CodeBlockType, FormatterSource, formatMessageContent } from '../utils/message-formatter';
import { isUserMessage } from '../utils/message-utils';
import { CodeBlock } from './CodeBlock';

type SessionMessageProps = {
  messages: SessionMessageType[];
  imageOffset: number;
  onImageClick: (imageIndex: number) => void;
  onPathClick?: (path: string) => void;
  pathValidation?: PathValidation[];
  searchTerm?: string;
  isSearchMatch?: boolean;
  availableImages?: number[];
  images?: SessionImage[];
};

export const SessionMessage = ({
  messages,
  onImageClick,
  pathValidation,
  searchTerm,
  isSearchMatch,
  availableImages = [],
  images = []
}: SessionMessageProps) => {
  const { allImageRefs, allCodeBlocks } = useMemo(() => {
    const refs: Array<{ index: number; exists: boolean; data?: string }> = [];
    const blocks: CodeBlockType[] = [];

    for (const message of messages) {
      if (typeof message.content === 'string') {
        const { imageRefs, codeBlocks } = formatMessageContent(message.content, {
          source: FormatterSource.SESSION_MESSAGE,
          pathValidation,
          searchTerm,
          availableImages,
          images,
          messageId: message.id
        });
        refs.push(...imageRefs);
        blocks.push(...codeBlocks);
      }
    }
    return { allImageRefs: refs, allCodeBlocks: blocks };
  }, [messages, pathValidation, searchTerm, availableImages, images]);

  if (messages.length === 0) {
    return null;
  }

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

          const parts = html.split(/(<div data-code-block="[^"]+"><\/div>)/);

          return (
            <div key={messageKey}>
              {idx > 0 && (
                <div className="flex justify-center my-2">
                  <div className="w-1/2 border-t border-border" />
                </div>
              )}
              <div className="text-left w-full">
                {parts.map((part) => {
                  const codeBlockMatch = part.match(/data-code-block="([^"]+)"/);
                  if (codeBlockMatch) {
                    const codeBlock = allCodeBlocks.find((block: CodeBlockType) => block.id === codeBlockMatch[1]);
                    if (codeBlock) {
                      return <CodeBlock key={codeBlock.id} language={codeBlock.language} code={codeBlock.code} />;
                    }
                  }
                  const cleanedPart = part.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/g, '');
                  if (!cleanedPart) return null;
                  const partKey = cleanedPart.substring(0, 50);
                  return <span key={`${messageKey}-${partKey}`} dangerouslySetInnerHTML={{ __html: cleanedPart }} />;
                })}
              </div>
            </div>
          );
        })}

        {isUser && allImageRefs.filter((img) => img.data).length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {allImageRefs
              .filter((img) => img.data)
              .map((imageRef) => {
                const messageId = messages[0].id;
                const globalImageIndex = images.findIndex(
                  (img) => img.messageId === messageId && img.index === imageRef.index
                );

                return (
                  <div key={`${messageId}-${imageRef.index}`} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onImageClick(globalImageIndex >= 0 ? globalImageIndex : 0)}
                      className="relative block w-32 h-32 rounded-lg border border-border overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <img
                        src={`data:image/png;base64,${imageRef.data}`}
                        alt={`#${imageRef.index}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs font-semibold px-1.5 py-0.5 rounded-tr-md">
                        #{imageRef.index}
                      </div>
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {isUser && (
        <img src="https://github.com/lucasvtiradentes.png" alt="User" className="h-6 w-6 shrink-0 rounded-full mt-2" />
      )}
    </div>
  );
};
