/** biome-ignore-all lint/suspicious/noArrayIndexKey: something */

import {
  type PathValidation,
  type SessionImage,
  SessionMessage as SessionMessageComponent,
  type SessionMessageType
} from '@better-claude-code/ui-components';
import type {
  GetApiSessionsProjectNameSessionId200ImagesItem,
  GetApiSessionsProjectNameSessionId200MessagesItem
} from '@/api/_generated/schemas';

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

export const SessionMessage = (props: SessionMessageProps) => {
  const mappedMessages: SessionMessageType[] = props.messages.map((msg) => ({
    id: msg.id,
    type: msg.type,
    content: msg.content,
    timestamp: msg.timestamp?.toString() || ''
  }));

  const mappedImages: SessionImage[] = (props.images || []).map((img) => ({
    index: img.index,
    data: img.data,
    messageId: img.messageId
  }));

  const mappedPathValidation: PathValidation[] | undefined = props.pathValidation;

  return (
    <SessionMessageComponent
      messages={mappedMessages}
      imageOffset={props.imageOffset}
      onImageClick={props.onImageClick}
      onPathClick={props.onPathClick}
      pathValidation={mappedPathValidation}
      searchTerm={props.searchTerm}
      isSearchMatch={props.isSearchMatch}
      availableImages={props.availableImages}
      images={mappedImages}
    />
  );
};
