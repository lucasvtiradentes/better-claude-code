import type { RefObject } from 'react';
import type {
  GetApiSessionsProjectName200ItemsItem,
  GetApiSessionsProjectNameSessionId200,
  GetApiSessionsProjectNameSessionId200MessagesItem
} from '@/api/_generated/schemas';
import { LiveMessageInput } from '@/features/live-sessions/LiveMessageInput';
import { FilterButtons } from './FilterButtons';
import { FileModal } from './modals/FileModal';
import { FolderModal } from './modals/FolderModal';
import { ImageModal } from './modals/ImageModal';
import { SearchNavigation } from './sessions-chat/SearchNavigation';
import { SessionMessage } from './sessions-chat/SessionMessage';
import { SessionBadges } from './sessions-sidebar/SessionBadges';

interface ProjectsContentProps {
  contentRef: RefObject<HTMLDivElement | null>;
  currentSession?: GetApiSessionsProjectName200ItemsItem;
  filteredMessages: GetApiSessionsProjectNameSessionId200MessagesItem[];
  pathValidation?: Array<{ path: string; exists: boolean }>;
  searchQuery?: string;
  searchMatches: number[];
  searchMatchIndex: number;
  imageModalIndex: number | null;
  fileModalPath: string | null;
  folderModalPath: string | null;
  selectedProject: string;
  sessionId: string;
  sessionData: GetApiSessionsProjectNameSessionId200;
  onNextMatch: () => void;
  onPreviousMatch: () => void;
  onCloseSearch: () => void;
  onImageClick: (index: number) => void;
  onPathClick: (path: string) => void;
  onImageModalClose: () => void;
  onImageModalNext: () => void;
  onImageModalPrev: () => void;
  onFileModalClose: () => void;
  onFolderModalClose: () => void;
  onFolderModalFileClick: (path: string) => void;
  onFolderModalFolderClick: (path: string) => void;
  onSendMessage?: (message: string) => void;
  messageInputDisabled?: boolean;
  messageInputPlaceholder?: string;
}

export function ProjectsContent({
  contentRef,
  currentSession,
  filteredMessages,
  pathValidation,
  searchQuery,
  searchMatches,
  searchMatchIndex,
  imageModalIndex,
  fileModalPath,
  folderModalPath,
  selectedProject,
  sessionId,
  sessionData,
  onNextMatch,
  onPreviousMatch,
  onCloseSearch,
  onImageClick,
  onPathClick,
  onImageModalClose,
  onImageModalNext,
  onImageModalPrev,
  onFileModalClose,
  onFolderModalClose,
  onFolderModalFileClick,
  onSendMessage,
  messageInputDisabled = false,
  messageInputPlaceholder = 'Type your message...'
}: ProjectsContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            {currentSession && <SessionBadges session={currentSession} showSearch />}
          </div>
        </div>
        <FilterButtons />
      </div>
      {searchQuery && searchMatches.length > 0 && (
        <SearchNavigation
          searchTerm={searchQuery}
          currentIndex={searchMatchIndex}
          totalMatches={searchMatches.length}
          onNext={onNextMatch}
          onPrevious={onPreviousMatch}
          onClose={onCloseSearch}
        />
      )}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
        {(() => {
          const groupedMessages: Array<{
            messages: GetApiSessionsProjectNameSessionId200MessagesItem[];
            startIndex: number;
          }> = [];

          let currentGroup: GetApiSessionsProjectNameSessionId200MessagesItem[] = [];
          let currentGroupStartIndex = 0;

          filteredMessages.forEach((message, idx) => {
            if (currentGroup.length === 0) {
              currentGroup = [message];
              currentGroupStartIndex = idx;
            } else if (currentGroup[0].type === message.type) {
              currentGroup.push(message);
            } else {
              groupedMessages.push({
                messages: currentGroup,
                startIndex: currentGroupStartIndex
              });
              currentGroup = [message];
              currentGroupStartIndex = idx;
            }
          });

          if (currentGroup.length > 0) {
            groupedMessages.push({
              messages: currentGroup,
              startIndex: currentGroupStartIndex
            });
          }

          return groupedMessages.map((group) => {
            const hasSearchMatch = group.messages.some((_, idx) =>
              searchMatches.includes(group.startIndex + idx)
            );

            const groupKey = group.messages[0].timestamp
              ? `${group.messages[0].type}-${group.messages[0].timestamp}`
              : `${group.messages[0].type}-${group.startIndex}`;

            return (
              <div
                key={groupKey}
                data-message-index={group.startIndex}
              >
                <SessionMessage
                  messages={group.messages}
                  imageOffset={0}
                  onImageClick={onImageClick}
                  onPathClick={onPathClick}
                  pathValidation={pathValidation}
                  searchTerm={searchQuery}
                  isSearchMatch={hasSearchMatch}
                  availableImages={sessionData.images.map((img) => img.index)}
                />
              </div>
            );
          });
        })()}
      </div>

      {onSendMessage && (
        <LiveMessageInput
          onSend={onSendMessage}
          disabled={messageInputDisabled}
          placeholder={messageInputPlaceholder}
        />
      )}

      {imageModalIndex !== null && (
        <ImageModal
          images={sessionData.images}
          currentIndex={imageModalIndex}
          onClose={onImageModalClose}
          onNext={onImageModalNext}
          onPrev={onImageModalPrev}
        />
      )}

      {fileModalPath && (
        <FileModal
          projectId={selectedProject}
          sessionId={sessionId}
          filePath={fileModalPath}
          onClose={onFileModalClose}
        />
      )}

      {folderModalPath && (
        <FolderModal
          projectId={selectedProject}
          sessionId={sessionId}
          folderPath={folderModalPath}
          onClose={onFolderModalClose}
          onFileClick={onFolderModalFileClick}
        />
      )}
    </div>
  );
}
