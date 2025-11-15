import { type SessionImage, SessionMessage, type SessionMessageType } from '@better-claude-code/ui-components';

type SessionContentProps = {
  groupedMessages: SessionMessageType[][];
  images: SessionImage[];
  onImageClick: (imageIndex: number) => void;
};

export const SessionContent = ({ groupedMessages, images, onImageClick }: SessionContentProps) => {
  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div className="max-w-4xl mx-auto p-5">
        <div className="space-y-2">
          {groupedMessages.map((messages) => {
            const firstMessage = messages[0];
            return (
              <SessionMessage
                key={firstMessage.id}
                messages={messages}
                imageOffset={0}
                onImageClick={onImageClick}
                images={images}
                availableImages={images.map((img) => img.index)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
