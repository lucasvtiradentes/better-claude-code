import { type SessionImage, SessionMessage, type SessionMessageType } from '@better-claude-code/ui-components';
import { useEffect, useMemo, useState } from 'react';

declare const acquireVsCodeApi: () => {
  postMessage: (message: unknown) => void;
  setState: (state: unknown) => void;
  getState: () => unknown;
};

const vscode = acquireVsCodeApi();

type SessionData = {
  session: {
    id: string;
    title: string;
    shortId: string;
    createdAt: string;
    messageCount: number;
    tokenPercentage?: number;
  };
  conversation: {
    messages: SessionMessageType[];
    images: SessionImage[];
  };
};

const FilterButtons = ({
  showUserMessages,
  showAssistantMessages,
  showToolCalls,
  onToggleUser,
  onToggleAssistant,
  onToggleToolCalls
}: {
  showUserMessages: boolean;
  showAssistantMessages: boolean;
  showToolCalls: boolean;
  onToggleUser: () => void;
  onToggleAssistant: () => void;
  onToggleToolCalls: () => void;
}) => {
  const buttonClass = (active: boolean) =>
    `bg-card border border-border rounded-md w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 relative group ${active ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleAssistant}
        className={buttonClass(showAssistantMessages)}
        title="Claude Code messages"
        aria-label="Claude Code messages"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={showAssistantMessages ? '3' : '2'}
          className="transition-all"
          aria-hidden="true"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onToggleUser}
        className={buttonClass(showUserMessages)}
        title="Your messages"
        aria-label="Your messages"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={showUserMessages ? '3' : '2'}
          className="transition-all"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onToggleToolCalls}
        className={buttonClass(showToolCalls)}
        title="Tool calls"
        aria-label="Tool calls"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={showToolCalls ? '3' : '2'}
          className="transition-all"
          aria-hidden="true"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </button>
    </div>
  );
};

export const App = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showUserMessages, setShowUserMessages] = useState(true);
  const [showAssistantMessages, setShowAssistantMessages] = useState(true);
  const [showToolCalls, setShowToolCalls] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'sessionData') {
        setSessionData(message.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    vscode.postMessage({ type: 'ready' });
  }, []);

  const filteredMessages = useMemo(() => {
    if (!sessionData) return [];

    let messages = sessionData.conversation.messages.filter(
      (msg) => (msg.type === 'user' && showUserMessages) || (msg.type === 'assistant' && showAssistantMessages)
    );

    if (!showToolCalls) {
      messages = messages
        .map((msg) => {
          if (typeof msg.content !== 'string') return msg;

          const lines = msg.content.split('\n');
          const filtered = lines.filter((line) => !line.trim().startsWith('[Tool:'));

          let cleaned = filtered.join('\n');

          while (cleaned.includes('---\n---')) {
            cleaned = cleaned.replace(/---\n---/g, '---');
          }

          cleaned = cleaned
            .split('\n---\n')
            .filter((part) => part.trim().length > 0)
            .join('\n---\n')
            .replace(/^\n*---\n*/g, '')
            .replace(/\n*---\n*$/g, '')
            .trim();

          return { ...msg, content: cleaned };
        })
        .filter((msg) => {
          if (typeof msg.content === 'string') {
            return msg.content.trim().length > 0;
          }
          return true;
        });
    }

    return messages;
  }, [sessionData, showUserMessages, showAssistantMessages, showToolCalls]);

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const { session, conversation } = sessionData;
  const createdDate = new Date(session.createdAt).toLocaleString();

  const groupedMessages: SessionMessageType[][] = [];
  let currentGroup: SessionMessageType[] = [];
  let lastType = '';

  for (const message of filteredMessages) {
    if (message.type !== lastType && currentGroup.length > 0) {
      groupedMessages.push([...currentGroup]);
      currentGroup = [];
    }
    currentGroup.push(message);
    lastType = message.type;
  }

  if (currentGroup.length > 0) {
    groupedMessages.push(currentGroup);
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto p-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">{session.title}</h1>
            <FilterButtons
              showUserMessages={showUserMessages}
              showAssistantMessages={showAssistantMessages}
              showToolCalls={showToolCalls}
              onToggleUser={() => setShowUserMessages(!showUserMessages)}
              onToggleAssistant={() => setShowAssistantMessages(!showAssistantMessages)}
              onToggleToolCalls={() => setShowToolCalls(!showToolCalls)}
            />
          </div>
          <div className="text-sm text-muted-foreground flex gap-4">
            <span>ID: {session.shortId}</span>
            <span>{createdDate}</span>
            <span>{session.messageCount} messages</span>
            {session.tokenPercentage && <span>{session.tokenPercentage}% tokens</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-5">
        <div className="space-y-2">
          {groupedMessages.map((messages) => {
            const firstMessage = messages[0];
            return (
              <SessionMessage
                key={firstMessage.id}
                messages={messages}
                imageOffset={0}
                onImageClick={(imageIndex) => setSelectedImageIndex(imageIndex)}
                images={conversation.images}
                availableImages={conversation.images.map((img) => img.index)}
              />
            );
          })}
        </div>
      </div>

      {selectedImageIndex !== null && conversation.images[selectedImageIndex] && (
        <button
          type="button"
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            <img
              src={`data:image/png;base64,${conversation.images[selectedImageIndex].data}`}
              alt={`#${conversation.images[selectedImageIndex].index}`}
              className="w-full h-auto"
            />
          </div>
        </button>
      )}
    </div>
  );
};
