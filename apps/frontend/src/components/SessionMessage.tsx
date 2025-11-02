import type { Message } from '@bcc/shared';
import { parseMessageContent, detectCommand } from '../utils/message-parser';

type SessionMessageProps = {
  message: Message;
  imageOffset: number;
  onImageClick: (imageIndex: number) => void;
};

export const SessionMessage = ({ message, imageOffset, onImageClick }: SessionMessageProps) => {
  const { text, toolCalls, images } = parseMessageContent(message.content, imageOffset);
  const command = detectCommand(text);

  const isRainbow = text.toLowerCase().includes('ultrathink');

  return (
    <div className={`p-4 rounded-lg ${message.type === 'user' ? 'bg-blue-900/20' : 'bg-surface'}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
          }`}
        >
          {message.type === 'user' ? 'U' : 'A'}
        </div>

        <div className="flex-1 space-y-3">
          {command && (
            <div className="text-sm px-3 py-1 bg-yellow-900/30 text-yellow-500 rounded border border-yellow-600/30">
              Command: {command}
            </div>
          )}

          <div
            className={`whitespace-pre-wrap ${isRainbow ? 'rainbow-text' : 'text-text-primary'}`}
            dangerouslySetInnerHTML={{
              __html: text.replace(/@([\w\-./]+)/g, '<span class="text-text-accent">@$1</span>')
            }}
          />

          {toolCalls.length > 0 && (
            <div className="space-y-2">
              {toolCalls.map((tool, idx) => (
                <div
                  key={idx}
                  className="text-sm font-mono bg-background/50 p-3 rounded border border-border"
                >
                  <span className="text-green-400">{tool.name}</span>
                  <span className="text-text-secondary">
                    ({Object.keys(tool.input).join(', ')})
                  </span>
                </div>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <div className="flex gap-2">
              {images.map((imageIndex) => (
                <button
                  key={imageIndex}
                  onClick={() => onImageClick(imageIndex)}
                  className="text-sm px-3 py-1 bg-purple-900/30 text-purple-400 rounded border border-purple-600/30 hover:bg-purple-900/50 transition-colors"
                >
                  [Image #{imageIndex}]
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
