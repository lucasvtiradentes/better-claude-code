import { useEffect, useRef } from 'react';
import { User, Bot, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, StreamStatus } from './types';
import { StreamingIndicator } from './StreamingIndicator';

type LiveMessageListProps = {
  messages: Message[];
  toolCalls: { toolName: string; args: any }[];
  status: StreamStatus;
};

export const LiveMessageList = ({ messages, toolCalls, status }: LiveMessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, toolCalls]);

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
          <div
            key={message.id}
            className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
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
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
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
            {toolCalls.map((tool, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2 text-sm">
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
