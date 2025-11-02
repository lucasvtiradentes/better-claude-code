import type { Message } from '@bcc/shared';
import { detectCommand, parseMessageContent } from '../../utils/message-parser';

type SessionMessageProps = {
  message: Message;
  imageOffset: number;
  onImageClick: (imageIndex: number) => void;
};

export const SessionMessage = ({ message, imageOffset, onImageClick }: SessionMessageProps) => {
  const { text, toolCalls, images } = parseMessageContent(message.content, imageOffset);
  const command = detectCommand(text);

  const isRainbow = text.toLowerCase().includes('ultrathink');

  const formattedText = text
    .replace(/@([\w\-./]+)/g, '<span class="text-[#ff9800] font-semibold cursor-pointer">@$1</span>')
    .replace(/---/g, '<div class="h-px bg-[#3e3e42] my-3 w-[40%] mx-auto"></div>');

  return (
    <div
      className={`
        mb-3 p-2 px-3 rounded-md break-words
        ${message.type === 'user' ? 'bg-[#0e639c] ml-10' : 'bg-[#1a1a1a] border border-[#3e3e42] mr-10'}
      `}
    >
      <div className="text-[11px] font-semibold mb-1 opacity-70 uppercase leading-none">
        {message.type === 'user' ? 'User' : 'Assistant'}
      </div>

      {command && (
        <div
          className="whitespace-pre-wrap text-[#4CAF50] font-semibold"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      )}

      {!command && (
        <div
          className={`whitespace-pre-wrap ${isRainbow ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 bg-clip-text text-transparent font-semibold' : ''}`}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      )}

      {toolCalls.length > 0 && (
        <div className="mt-2 space-y-1">
          {toolCalls.map((tool, idx) => (
            <div
              key={`${tool.name}-${idx}`}
              className="text-sm font-mono bg-[#1e1e1e] p-2 rounded border border-[#3e3e42]"
            >
              <span className="text-[#4CAF50]">{tool.name}</span>
              <span className="text-[#858585]">({Object.keys(tool.input).join(', ')})</span>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-2 flex gap-2">
          {images.map((imageIndex) => (
            <button
              key={imageIndex}
              type="button"
              onClick={() => onImageClick(imageIndex)}
              className="text-sm px-2 py-1 bg-[#9966ff]/20 text-[#9966ff] rounded border border-[#9966ff]/30 hover:bg-[#9966ff]/30 transition-colors font-semibold"
            >
              [Image #{imageIndex}]
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
