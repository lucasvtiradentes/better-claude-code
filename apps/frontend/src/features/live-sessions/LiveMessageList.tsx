import { Bot, User, Wrench } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { StreamingIndicator } from './StreamingIndicator';
import type { Message, StreamStatus } from './types';

type ImageData = {
  index: number;
  data: string;
  messageId: string;
};

type LiveMessageListProps = {
  messages: Message[];
  images?: ImageData[];
  toolCalls: { toolName: string; args: any }[];
  status: StreamStatus;
};

export const LiveMessageList = ({ messages, images = [], toolCalls, status }: LiveMessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(
      '[LiveMessageList] Messages:',
      messages.map((m) => ({ id: m.id, content: m.content.substring(0, 50) }))
    );
    console.log('[LiveMessageList] Images:', images);
  }, [messages, images]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center text-center text-muted-foreground">
          <div>
            <Bot className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>Start a conversation with Claude</p>
            <p className="text-sm">Type your message below to begin</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
            {message.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
            )}

            <div
              className={cn(
                'max-w-[80%] rounded-lg p-3',
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              <div className="whitespace-pre-wrap wrap-break-word">{message.content}</div>
              {message.role === 'user' && images.filter((img) => img.messageId === message.id).length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {images
                    .filter((img) => img.messageId === message.id)
                    .map((image) => (
                      <div key={`${message.id}-${image.index}`} className="relative shrink-0">
                        <img
                          src={`data:image/png;base64,${image.data}`}
                          alt={`Img #${image.index}`}
                          className="h-32 w-32 rounded border object-cover"
                        />
                        <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs font-semibold px-1.5 py-0.5 rounded-tr-md">
                          #{image.index}
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <div className="mt-1 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <User className="h-5 w-5" />
              </div>
            )}
          </div>
        ))}

        {toolCalls.length > 0 && (
          <div className="space-y-2">
            {toolCalls.map((tool) => (
              <div
                key={`${tool.toolName}-${Math.random()}`}
                className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2 text-sm"
              >
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span>
                  Using tool: <strong>{tool.toolName}</strong>
                </span>
              </div>
            ))}
          </div>
        )}

        {status === 'streaming' && <StreamingIndicator />}
      </div>
    </div>
  );
};
