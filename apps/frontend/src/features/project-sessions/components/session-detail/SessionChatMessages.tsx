import type { RefObject } from 'react';
import type { GetApiSessionsProjectNameSessionId200 } from '@/api';
import { useMessageGrouping } from '../../hooks/useMessageGrouping';
import { SessionMessage } from '../sessions-chat/SessionMessage';

interface SessionChatMessagesProps {
  contentRef: RefObject<HTMLDivElement | null>;
  filteredMessages: GetApiSessionsProjectNameSessionId200['messages'];
  pathValidation?: Array<{ path: string; exists: boolean }>;
  searchQuery?: string;
  searchMatches: number[];
  sessionData: GetApiSessionsProjectNameSessionId200;
  onImageClick: (index: number) => void;
  onPathClick: (path: string) => void;
}

export function SessionChatMessages({
  contentRef,
  filteredMessages,
  pathValidation,
  searchQuery,
  searchMatches,
  sessionData,
  onImageClick,
  onPathClick
}: SessionChatMessagesProps) {
  const groupedMessages = useMessageGrouping(filteredMessages);

  return (
    <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
      {groupedMessages.map((group) => {
        const hasSearchMatch = group.messages.some((_, idx) => searchMatches.includes(group.startIndex + idx));

        const groupKey = group.messages[0].id
          ? `${group.messages[0].id}`
          : `${group.messages[0].type}-${group.startIndex}`;

        return (
          <div key={groupKey} data-message-index={group.startIndex}>
            <SessionMessage
              messages={group.messages}
              imageOffset={0}
              onImageClick={onImageClick}
              onPathClick={onPathClick}
              pathValidation={pathValidation}
              searchTerm={searchQuery}
              isSearchMatch={hasSearchMatch}
              availableImages={sessionData?.images?.map((img) => img.index) || []}
              images={sessionData?.images || []}
            />
          </div>
        );
      })}
    </div>
  );
}
